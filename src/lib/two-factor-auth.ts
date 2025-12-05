/**
 * Service d'authentification à deux facteurs (2FA)
 * Utilise TOTP (Time-based One-Time Password) avec Google Authenticator, Authy, etc.
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from './database'
import { logger } from './logger'

/**
 * Génère un secret 2FA pour un utilisateur
 */
export async function generate2FASecret(userId: string, isAdmin: boolean = false): Promise<{
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}> {
  // Générer un secret TOTP
  const secret = speakeasy.generateSecret({
    name: `Atiha (${isAdmin ? 'Admin' : 'User'})`,
    issuer: 'Atiha',
    length: 32,
  })

  // Générer des codes de secours (8 codes de 8 caractères)
  const backupCodes = Array.from({ length: 8 }, () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  })

  // Sauvegarder dans la base de données (sans activer)
  if (isAdmin) {
    await prisma.adminTwoFactorAuth.upsert({
      where: { adminId: userId },
      update: {
        secret: secret.base32!,
        backupCodes: backupCodes,
        enabled: false,
      },
      create: {
        adminId: userId,
        secret: secret.base32!,
        backupCodes: backupCodes,
        enabled: false,
      },
    })
  } else {
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: secret.base32!,
        backupCodes: backupCodes,
        enabled: false,
      },
      create: {
        userId,
        secret: secret.base32!,
        backupCodes: backupCodes,
        enabled: false,
      },
    })
  }

  // Générer le QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  logger.info('2FA secret generated', { userId, isAdmin })

  return {
    secret: secret.base32!,
    qrCodeUrl,
    backupCodes,
  }
}

/**
 * Vérifie un code TOTP
 */
export async function verify2FACode(
  userId: string,
  token: string,
  isAdmin: boolean = false
): Promise<{ valid: boolean; isBackupCode: boolean }> {
  try {
    // Récupérer le secret depuis la base de données
    const twoFactorData = isAdmin
      ? await prisma.adminTwoFactorAuth.findUnique({
          where: { adminId: userId },
        })
      : await prisma.twoFactorAuth.findUnique({
          where: { userId },
        })

    if (!twoFactorData || !twoFactorData.enabled) {
      return { valid: false, isBackupCode: false }
    }

    // Vérifier si c'est un code de secours
    if (twoFactorData.backupCodes.includes(token)) {
      // Utiliser le code de secours (le supprimer après utilisation)
      const updatedBackupCodes = twoFactorData.backupCodes.filter(
        (code) => code !== token
      )

      if (isAdmin) {
        await prisma.adminTwoFactorAuth.update({
          where: { adminId: userId },
          data: { backupCodes: updatedBackupCodes },
        })
      } else {
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: { backupCodes: updatedBackupCodes },
        })
      }

      logger.info('2FA backup code used', { userId, isAdmin })
      return { valid: true, isBackupCode: true }
    }

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret: twoFactorData.secret,
      encoding: 'base32',
      token,
      window: 2, // Accepter les codes dans une fenêtre de ±2 périodes (60 secondes)
    })

    if (verified) {
      logger.info('2FA code verified successfully', { userId, isAdmin })
    } else {
      logger.warn('2FA code verification failed', { userId, isAdmin })
    }

    return { valid: verified, isBackupCode: false }
  } catch (error) {
    logger.error('Erreur lors de la vérification du code 2FA', error as Error)
    return { valid: false, isBackupCode: false }
  }
}

/**
 * Active le 2FA pour un utilisateur
 */
export async function enable2FA(
  userId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  try {
    if (isAdmin) {
      await prisma.adminTwoFactorAuth.update({
        where: { adminId: userId },
        data: { enabled: true },
      })
    } else {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { enabled: true },
      })
    }

    logger.info('2FA enabled', { userId, isAdmin })
    return true
  } catch (error) {
    logger.error('Erreur lors de l\'activation du 2FA', error as Error)
    return false
  }
}

/**
 * Désactive le 2FA pour un utilisateur
 */
export async function disable2FA(
  userId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  try {
    if (isAdmin) {
      await prisma.adminTwoFactorAuth.update({
        where: { adminId: userId },
        data: { enabled: false },
      })
    } else {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { enabled: false },
      })
    }

    logger.info('2FA disabled', { userId, isAdmin })
    return true
  } catch (error) {
    logger.error('Erreur lors de la désactivation du 2FA', error as Error)
    return false
  }
}

/**
 * Vérifie si le 2FA est activé pour un utilisateur
 */
export async function is2FAEnabled(
  userId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  try {
    const twoFactorData = isAdmin
      ? await prisma.adminTwoFactorAuth.findUnique({
          where: { adminId: userId },
        })
      : await prisma.twoFactorAuth.findUnique({
          where: { userId },
        })

    return twoFactorData?.enabled ?? false
  } catch (error) {
    logger.error('Erreur lors de la vérification du statut 2FA', error as Error)
    return false
  }
}

/**
 * Régénère les codes de secours
 */
export async function regenerateBackupCodes(
  userId: string,
  isAdmin: boolean = false
): Promise<string[]> {
  try {
    const backupCodes = Array.from({ length: 8 }, () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase()
    })

    if (isAdmin) {
      await prisma.adminTwoFactorAuth.update({
        where: { adminId: userId },
        data: { backupCodes },
      })
    } else {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { backupCodes },
      })
    }

    logger.info('2FA backup codes regenerated', { userId, isAdmin })
    return backupCodes
  } catch (error) {
    logger.error('Erreur lors de la régénération des codes de secours', error as Error)
    throw error
  }
}


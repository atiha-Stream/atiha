# 🔌 Exemples d'Intégration : Architecture Anonyme dans Atiha

## 📱 Frontend Web (Next.js/React)

### Configuration API Client

**Fichier** : `lib/api-client.ts`

```typescript
// lib/api-client.ts
import sdkConfig from '@/config/sdk_config.json';

interface ApiConfig {
  host_list: string[];
  cdn_url: string;
  backup_hosts: string[];
}

class ApiClient {
  private config: ApiConfig = sdkConfig;
  private currentHostIndex = 0;

  /**
   * Récupère le host API actuel (avec failover)
   */
  private getCurrentHost(): string {
    return this.config.host_list[this.currentHostIndex];
  }

  /**
   * Passe au host suivant en cas d'erreur
   */
  private rotateHost(): void {
    this.currentHostIndex = 
      (this.currentHostIndex + 1) % this.config.host_list.length;
  }

  /**
   * Fait une requête API avec failover automatique
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxAttempts = this.config.host_list.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const host = this.getCurrentHost();
        const url = `${host}${endpoint}`;

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AtihaWeb/1.0',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Host ${this.getCurrentHost()} failed, trying next...`,
          error
        );
        this.rotateHost();
      }
    }

    throw new Error(
      `All API hosts failed. Last error: ${lastError?.message}`
    );
  }

  /**
   * Récupère l'URL CDN pour un fichier
   */
  getCdnUrl(path: string): string {
    return `${this.config.cdn_url}${path}`;
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Méthodes pratiques
export const api = {
  get: <T>(endpoint: string) => apiClient.request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data: any) =>
    apiClient.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: any) =>
    apiClient.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    apiClient.request<T>(endpoint, { method: 'DELETE' }),
};
```

---

### Utilisation dans les Composants

**Exemple** : `app/api/movies/page.tsx`

```typescript
// app/api/movies/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface Movie {
  id: string;
  title: string;
  posterUrl: string;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const data = await api.get<{ movies: Movie[] }>('/api/movies');
        setMovies(data.movies);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Movies</h1>
      {movies.map((movie) => (
        <div key={movie.id}>
          <img src={apiClient.getCdnUrl(movie.posterUrl)} alt={movie.title} />
          <h2>{movie.title}</h2>
        </div>
      ))}
    </div>
  );
}
```

---

## 📱 Application Mobile (React Native)

### Configuration

**Fichier** : `src/config/api.ts`

```typescript
// src/config/api.ts
import sdkConfig from '../../assets/sdk_config.json';

interface ApiConfig {
  host_list: string[];
  cdn_url: string;
  backup_hosts: string[];
}

class MobileApiClient {
  private config: ApiConfig = sdkConfig;
  private currentHostIndex = 0;

  private getCurrentHost(): string {
    return this.config.host_list[this.currentHostIndex];
  }

  private rotateHost(): void {
    this.currentHostIndex = 
      (this.currentHostIndex + 1) % this.config.host_list.length;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxAttempts = this.config.host_list.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const host = this.getCurrentHost();
        const url = `${host}${endpoint}`;

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AtihaMobile/1.0',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Host failed, rotating...`);
        this.rotateHost();
      }
    }

    throw new Error(`All hosts failed: ${lastError?.message}`);
  }

  getCdnUrl(path: string): string {
    return `${this.config.cdn_url}${path}`;
  }
}

export const mobileApiClient = new MobileApiClient();
```

---

## 🤖 Application Android (Kotlin)

### Configuration Manager

**Fichier** : `ConfigManager.kt`

```kotlin
// ConfigManager.kt
package com.atiha.config

import android.content.Context
import org.json.JSONObject
import java.io.IOException

data class ApiConfig(
    val hostList: List<String>,
    val cdnUrl: String,
    val backupHosts: List<String>
)

object ConfigManager {
    private var config: ApiConfig? = null
    private var currentHostIndex = 0

    fun initialize(context: Context) {
        try {
            val jsonString = context.assets.open("sdk_config.json")
                .bufferedReader().use { it.readText() }
            
            val json = JSONObject(jsonString)
            
            val hostList = mutableListOf<String>()
            val hostArray = json.getJSONArray("host_list")
            for (i in 0 until hostArray.length()) {
                hostList.add(hostArray.getString(i))
            }
            
            val backupHosts = mutableListOf<String>()
            val backupArray = json.getJSONArray("backup_hosts")
            for (i in 0 until backupArray.length()) {
                backupHosts.add(backupArray.getString(i))
            }
            
            config = ApiConfig(
                hostList = hostList,
                cdnUrl = json.getString("cdn_url"),
                backupHosts = backupHosts
            )
        } catch (e: IOException) {
            // Fallback vers configuration par défaut
            config = ApiConfig(
                hostList = listOf(
                    "https://api-gateway.atiha-redir-1.com",
                    "https://api-gateway.atiha-redir-2.com"
                ),
                cdnUrl = "https://atiha-cdn.anonymous-site.site",
                backupHosts = emptyList()
            )
        }
    }

    fun getCurrentHost(): String {
        val hosts = config?.hostList ?: emptyList()
        return hosts[currentHostIndex % hosts.size]
    }

    fun rotateHost() {
        val hosts = config?.hostList ?: emptyList()
        if (hosts.isNotEmpty()) {
            currentHostIndex = (currentHostIndex + 1) % hosts.size
        }
    }

    fun getCdnUrl(path: String): String {
        return "${config?.cdnUrl}$path"
    }

    fun getConfig(): ApiConfig? = config
}
```

---

### API Client Android

**Fichier** : `ApiClient.kt`

```kotlin
// ApiClient.kt
package com.atiha.network

import com.atiha.config.ConfigManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class ApiClient private constructor() {
    private val client = OkHttpClient.Builder()
        .build()

    companion object {
        @Volatile
        private var INSTANCE: ApiClient? = null

        fun getInstance(): ApiClient {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ApiClient().also { INSTANCE = it }
            }
        }
    }

    suspend fun <T> request(
        endpoint: String,
        method: String = "GET",
        body: JSONObject? = null
    ): Result<T> = withContext(Dispatchers.IO) {
        val config = ConfigManager.getConfig()
            ?: return@withContext Result.failure(
                IllegalStateException("Config not initialized")
            )

        var lastException: Exception? = null

        // Essayer chaque host
        for (host in config.hostList) {
            try {
                val url = "$host$endpoint"
                val request = buildRequest(url, method, body)

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    @Suppress("UNCHECKED_CAST")
                    return@withContext Result.success(
                        JSONObject(responseBody ?: "{}") as T
                    )
                } else {
                    throw IOException("HTTP ${response.code}: ${response.message}")
                }
            } catch (e: Exception) {
                lastException = e
                // Rotate vers le prochain host
                ConfigManager.rotateHost()
            }
        }

        // Tous les hosts ont échoué
        Result.failure(
            lastException ?: Exception("All API hosts failed")
        )
    }

    private fun buildRequest(
        url: String,
        method: String,
        body: JSONObject?
    ): Request {
        val builder = Request.Builder()
            .url(url)
            .addHeader("User-Agent", "AtihaAndroid/1.0")
            .addHeader("Content-Type", "application/json")

        when (method.uppercase()) {
            "POST", "PUT" -> {
                val mediaType = "application/json".toMediaType()
                val requestBody = body?.toString()
                    ?.toRequestBody(mediaType)
                builder.method(method, requestBody)
            }
            "DELETE" -> {
                builder.delete()
            }
            else -> {
                builder.get()
            }
        }

        return builder.build()
    }
}

// Extension pour faciliter l'utilisation
suspend fun <T> ApiClient.get(endpoint: String): Result<T> {
    return request(endpoint, "GET")
}

suspend fun <T> ApiClient.post(endpoint: String, body: JSONObject): Result<T> {
    return request(endpoint, "POST", body)
}

suspend fun <T> ApiClient.put(endpoint: String, body: JSONObject): Result<T> {
    return request(endpoint, "PUT", body)
}

suspend fun <T> ApiClient.delete(endpoint: String): Result<T> {
    return request(endpoint, "DELETE")
}
```

---

### Utilisation dans Android

**Exemple** : `MovieRepository.kt`

```kotlin
// MovieRepository.kt
package com.atiha.data

import com.atiha.config.ConfigManager
import com.atiha.network.ApiClient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.json.JSONObject

data class Movie(
    val id: String,
    val title: String,
    val posterUrl: String
)

class MovieRepository {
    private val apiClient = ApiClient.getInstance()

    fun getMovies(): Flow<Result<List<Movie>>> = flow {
        val result = apiClient.get<JSONObject>("/api/movies")
        
        result.fold(
            onSuccess = { json ->
                val movies = parseMovies(json)
                emit(Result.success(movies))
            },
            onFailure = { error ->
                emit(Result.failure(error))
            }
        )
    }

    private fun parseMovies(json: JSONObject): List<Movie> {
        val moviesArray = json.getJSONArray("movies")
        val movies = mutableListOf<Movie>()
        
        for (i in 0 until moviesArray.length()) {
            val movieJson = moviesArray.getJSONObject(i)
            movies.add(
                Movie(
                    id = movieJson.getString("id"),
                    title = movieJson.getString("title"),
                    posterUrl = ConfigManager.getCdnUrl(
                        movieJson.getString("posterUrl")
                    )
                )
            )
        }
        
        return movies
    }
}
```

---

## 🔐 Sécurité Avancée

### Certificate Pinning (Android)

**Fichier** : `CertificatePinner.kt`

```kotlin
// CertificatePinner.kt
import okhttp3.CertificatePinner as OkHttpCertificatePinner

object SecureCertificatePinner {
    fun create(): OkHttpCertificatePinner {
        return OkHttpCertificatePinner.Builder()
            .add(
                "api-gateway.atiha-redir-1.com",
                "sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            )
            .add(
                "api-gateway.atiha-redir-2.com",
                "sha256/YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"
            )
            .build()
    }
}

// Utilisation dans ApiClient
private val client = OkHttpClient.Builder()
    .certificatePinner(SecureCertificatePinner.create())
    .build()
```

### Obfuscation des URLs (Android)

**Fichier** : `StringObfuscator.kt`

```kotlin
// StringObfuscator.kt
object StringObfuscator {
    // En production, utiliser une vraie encryption
    private val key = "YOUR_SECRET_KEY"
    
    fun encrypt(url: String): String {
        // Implémentation d'encryption (ex: AES)
        return Base64.encodeToString(
            url.toByteArray(),
            Base64.NO_WRAP
        )
    }
    
    fun decrypt(encrypted: String): String {
        return String(
            Base64.decode(encrypted, Base64.NO_WRAP)
        )
    }
}

// Utilisation
// Au lieu de coder en dur :
// val url = "https://api-gateway.atiha-redir-1.com"
// Utiliser :
val encryptedUrl = StringObfuscator.decrypt(
    resources.getString(R.string.encrypted_api_url)
)
```

---

## 📝 Notes Importantes

1. **Ne JAMAIS coder les URLs en dur** dans le code source
2. **Toujours utiliser le fichier de configuration** `sdk_config.json`
3. **Implémenter le failover** automatique entre hosts
4. **Tester la connectivité** avant de déployer
5. **Utiliser HTTPS uniquement** (pas de HTTP en production)
6. **Activer certificate pinning** pour éviter les attaques MITM
7. **Obfusquer le code** (ProGuard/R8 pour Android)

---

## 🔄 Mise à Jour Dynamique

Pour permettre la mise à jour de la configuration sans recompiler :

```typescript
// Web - Mise à jour depuis un endpoint
async function updateConfig() {
  try {
    const response = await fetch('/api/config');
    const newConfig = await response.json();
    
    // Mettre à jour la configuration
    localStorage.setItem('apiConfig', JSON.stringify(newConfig));
    
    // Recharger la config dans l'API client
    apiClient.updateConfig(newConfig);
  } catch (error) {
    console.error('Failed to update config:', error);
  }
}
```

```kotlin
// Android - Mise à jour depuis un endpoint
suspend fun updateConfig(context: Context) {
    try {
        val config = apiClient.get<JSONObject>("/api/config")
        config.onSuccess { json ->
            // Sauvegarder dans SharedPreferences
            val prefs = context.getSharedPreferences("config", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("api_config", json.toString())
                .apply()
            
            // Recharger la config
            ConfigManager.loadFromPreferences(context)
        }
    } catch (e: Exception) {
        Log.e("Config", "Failed to update config", e)
    }
}
```


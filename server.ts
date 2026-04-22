import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import archiver from "archiver";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

// --- API ROUTES ---

// 1. Analyze Website URL
app.post("/api/analyze-url", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
      timeout: 10000
    });
    const $ = cheerio.load(response.data);
    
    const title = $("title").text() || $("meta[property='og:title']").attr("content") || "My App";
    const description = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "";
    
    // Favicon detection
    let favicon = $("link[rel='icon']").attr("href") || $("link[rel='shortcut icon']").attr("href") || "/favicon.ico";
    if (favicon && !favicon.startsWith("http")) {
      const baseUrl = new URL(url).origin;
      favicon = new URL(favicon, baseUrl).toString();
    }

    res.json({
      title,
      description,
      favicon,
      status: "success"
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze URL: " + error.message });
  }
});

// 2. Generate React Native Project
app.post("/api/generate-project", async (req, res) => {
  const { url, name, primaryColor, theme, showControls } = req.body;

  try {
    res.attachment(`${name.replace(/\s+/g, '-').toLowerCase()}-mobile-app.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // package.json for Expo
    const packageJson = {
      name: name.replace(/\s+/g, '-').toLowerCase(),
      version: "1.0.0",
      main: "index.js",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web"
      },
      dependencies: {
        "expo": "~52.0.0",
        "expo-status-bar": "~2.0.0",
        "react": "18.3.1",
        "react-native": "0.76.0",
        "react-native-webview": "13.12.2",
        "expo-linking": "~7.0.0"
      },
      devDependencies: {
        "@types/react": "~18.3.12",
        "typescript": "~5.3.3"
      },
      private: true
    };

    // app.json for Expo
    const appJson = {
      expo: {
        name,
        slug: name.replace(/\s+/g, '-').toLowerCase(),
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: theme,
        splash: {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: primaryColor
        },
        assetBundlePatterns: ["**/*"],
        ios: { supportsTablet: true },
        android: { adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: primaryColor } },
        web: { favicon: "./assets/favicon.png" }
      }
    };

    // App.tsx for the mobile app
    const appTsx = `
import React, { useRef, useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="${theme === 'dark' ? 'light' : 'dark'}" />
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: '${url}' }}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="${primaryColor}" />
          </View>
        )}
      </View>
      {${showControls} && canGoBack && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleBackPress} style={[styles.backButton, { backgroundColor: '${primaryColor}' }]}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '${theme === 'dark' ? '#000' : '#fff'}' },
  webViewContainer: { flex: 1 },
  webview: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}' },
  controls: { padding: 10, borderTopWidth: 1, borderColor: '#eee' },
  backButton: { padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  backText: { color: '#fff', fontWeight: 'bold' }
});
    `;

    archive.append(JSON.stringify(packageJson, null, 2), { name: "package.json" });
    archive.append(JSON.stringify(appJson, null, 2), { name: "app.json" });
    archive.append(appTsx, { name: "App.tsx" });
    archive.append("Expo project generated by Appify", { name: "README.md" });

    // Mock assets
    archive.append("", { name: "assets/.gitkeep" });

    await archive.finalize();
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate project" });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


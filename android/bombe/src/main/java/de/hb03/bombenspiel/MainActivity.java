package de.hb03.bombenspiel;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.view.WindowCompat;
import androidx.webkit.WebViewAssetLoader;

import java.util.Locale;

/**
 * WebView-Hülle für das Bombenspiel.
 *  - lädt bombe.html aus den App-Assets (WebViewAssetLoader, https-Herkunft)
 *  - blendet die Systemleisten aus (immersiver Vollbildmodus)
 *  - stellt der Web-Seite eine native TextToSpeech-Brücke bereit
 *    (`window.AndroidTTS.speak`), weil Android-WebViews die Web-Speech-API
 *    nicht unterstützen.
 */
public class MainActivity extends Activity {

    private static final String BASE =
            "https://appassets.androidplatform.net/assets/www/";

    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge: Inhalt zeichnet hinter die (transparenten) Systemleisten,
        // damit kein schwarzer Balken oben/unten entsteht.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        // Native Text-to-Speech vorbereiten
        tts = new TextToSpeech(this, status -> {
            ttsReady = (status == TextToSpeech.SUCCESS);
            if (ttsReady) {
                try { tts.setLanguage(Locale.GERMAN); } catch (Exception ignored) {}
            }
        });

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        // Brücke: window.AndroidTTS.speak(text, lang)
        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });

        setContentView(web);

        if (savedInstanceState == null) {
            web.loadUrl(BASE + "bombe.html");
        } else {
            web.restoreState(savedInstanceState);
        }
    }

    /** Systemleisten (Status- & Navigationsleiste) ausblenden – immersiver Vollbildmodus. */
    private void hideSystemBars() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
              | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
              | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
              | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
              | View.SYSTEM_UI_FLAG_FULLSCREEN
              | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { try { tts.stop(); tts.shutdown(); } catch (Exception ignored) {} tts = null; }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /** Wird der Web-Seite als `window.AndroidTTS` bereitgestellt. */
    private class TtsBridge {
        @JavascriptInterface
        public void speak(final String text, final String lang) {
            if (tts == null || text == null) return;
            web.post(() -> {
                try {
                    tts.setLanguage(lang != null && lang.startsWith("en") ? Locale.US : Locale.GERMAN);
                } catch (Exception ignored) {}
                try {
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bombe");
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) try { tts.stop(); } catch (Exception ignored) {}
        }
    }
}

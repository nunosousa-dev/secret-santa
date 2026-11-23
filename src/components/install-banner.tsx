"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Icon } from "./icon";
import styles from "./install-banner.module.css";

interface BrowserInstallPrompt extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

const dismissalKey = "amigo-secreto-install-dismissed";

function mobilePlatform() {
  const { userAgent, maxTouchPoints } = navigator;
  if (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return null;
}

function rememberDismissal() {
  try {
    localStorage.setItem(dismissalKey, "1");
  } catch {
    // Restricted storage still allows dismissal on the current page.
  }
}

function wasDismissed() {
  try {
    return localStorage.getItem(dismissalKey) === "1";
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const pathname = usePathname();
  const instructionsId = useId();
  const [platform, setPlatform] = useState<ReturnType<typeof mobilePlatform>>(null);
  const [prompt, setPrompt] = useState<BrowserInstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    if (!window.isSecureContext || standalone.matches || ("standalone" in navigator && navigator.standalone === true) || wasDismissed()) return;

    const frame = requestAnimationFrame(() => setPlatform(mobilePlatform()));
    function receivePrompt(event: Event) {
      if (wasDismissed()) return;
      event.preventDefault();
      setPrompt(event as BrowserInstallPrompt);
    }
    function hideAfterInstall() {
      if (standalone.matches) setDismissed(true);
    }
    function markInstalled() {
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", receivePrompt);
    window.addEventListener("appinstalled", markInstalled);
    standalone.addEventListener("change", hideAfterInstall);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", receivePrompt);
      window.removeEventListener("appinstalled", markInstalled);
      standalone.removeEventListener("change", hideAfterInstall);
    };
  }, []);

  if ((pathname !== "/" && !/^\/p\/[^/]+\/?$/.test(pathname ?? "")) || dismissed || (!platform && !prompt)) return null;
  const canPrompt = prompt && !showInstructions;

  async function install() {
    if (!prompt) return;
    setInstalling(true);
    try {
      const choice = await prompt.prompt();
      if (choice.outcome === "accepted") setDismissed(true);
    } catch {
      setShowInstructions(true);
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  function dismiss() {
    rememberDismissal();
    setDismissed(true);
  }

  return (
    <div className={`container ${styles.wrapper}`} data-print-hidden>
      <aside className={styles.banner} aria-label="Instalar o Amigo Secreto">
        <span className={styles.icon}><Icon name="gift" size={23} /></span>
        <div className={styles.copy}>
          <p className={styles.title}>Instala o Amigo Secreto</p>
          <p className={styles.description}>{platform ? "Abre o site diretamente pelo ecrã principal." : "Abre o site numa janela própria."}</p>
        </div>
        {canPrompt || !platform ? (
          <button className={`button button-secondary ${styles.action}`} type="button" onClick={install} disabled={installing}>Instalar</button>
        ) : (
          <button className={`button button-secondary ${styles.action}`} type="button" onClick={() => setShowInstructions(!showInstructions)} aria-expanded={showInstructions} aria-controls={instructionsId}>Como instalar</button>
        )}
        <button className={styles.dismiss} type="button" onClick={dismiss} aria-label="Fechar aviso de instalação"><Icon name="close" size={20} /></button>
        {platform && (
          <p className={styles.instructions} id={instructionsId} hidden={!showInstructions}>
            {platform === "ios" ? (
              <>No Safari, abre o menu <strong>Partilhar</strong> e escolhe <strong>Adicionar ao ecrã principal</strong>. Se aparecer a opção <strong>Abrir como aplicação web</strong>, ativa-a e toca em <strong>Adicionar</strong>.</>
            ) : (
              <>No Chrome, abre o menu e procura <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã principal</strong>. Segue os passos no ecrã.</>
            )}
          </p>
        )}
      </aside>
    </div>
  );
}

import Link from "next/link";
import { Icon } from "./icon";
import styles from "./shell.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header} data-print-hidden>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="Amigo Secreto — página inicial">
          <span className={styles.brandIcon}><Icon name="gift" size={24} /></span>
          <span>amigo<span className={styles.brandSecond}>secreto</span></span>
        </Link>
        <span className={styles.season}><span aria-hidden="true">✳</span> Natal em família</span>
      </div>
    </header>
  );
}

export function SiteFooter({ year }: { year: number }) {
  return <footer className={styles.footer} data-print-hidden><Icon name="heart" size={15} /><span>O melhor do Natal é partilhá-lo.</span><span className={styles.footerYear}>{year}</span></footer>;
}

export function SampleNotice() {
  return <aside className={styles.sampleNotice} data-print-hidden><span className={styles.sampleDot} />Pré-visualização · nomes, avatares e preferências fictícios.</aside>;
}

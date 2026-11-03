import { Suspense } from "react";
import { FamilyDirectory } from "@/components/family-directory";
import { Icon } from "@/components/icon";
import { ChristmasTree } from "@/components/christmas-tree";
import { formatBudget, formatExchangeDate } from "@/lib/sample-data";
import { getStore } from "@/lib/db";
import styles from "./page.module.css";

function ChristmasIllustration() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <ChristmasTree />
      <div className={styles.wishCard}>
        <span className={styles.cardEyebrow}>ESTE NATAL</span>
        <span className={styles.cardTitle}>Feito de<br /><em>carinho.</em></span>
        <Icon name="heart" size={13} />
      </div>
      <span className={styles.handwritten}>a magia está nos pequenos detalhes</span>
    </div>
  );
}

export default function Home() {
  const family = getStore().getFamily();
  const members = getStore().listMembers();
  return (
    <main id="content" className="container">
      <section className={styles.hero} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <h1 id="welcome-title">Pequenos desejos,<br />grandes <em>sorrisos.</em></h1>
          <p className={styles.seasonBadge}><Icon name="star" size={13} />{family.name} · {family.year}</p>
          <p className={styles.welcome}>{family.welcome}</p>
          <a className="button" href="#family">Descobrir os desejos <Icon name="arrow" size={18} /></a>
          <p className={styles.heroNote}><Icon name="heart" size={14} /> Escolhidos com carinho. Oferecidos em segredo.</p>
        </div>
        <ChristmasIllustration />
      </section>
      {(family.exchangeDate || family.budget) && <div className={styles.exchangeDetails} aria-label="Detalhes da troca de presentes">
        <span className={styles.exchangeLabel}><Icon name="sparkles" size={18} /> O nosso encontro</span>
        {family.exchangeDate && <span><Icon name="calendar" size={17} /><time dateTime={family.exchangeDate}>{formatExchangeDate(family.exchangeDate)}</time></span>}
        {family.budget && <span><Icon name="coin" size={17} />Até {formatBudget(family.budget)} por presente</span>}
        <span className={styles.exchangeEnding}>O carinho não tem preço.</span>
      </div>}
      <Suspense fallback={null}><FamilyDirectory members={members} /></Suspense>
      <section className={styles.howItWorks} aria-labelledby="how-title">
        <div className={styles.howIcon}><Icon name="gift" size={29} /></div>
        <div><h2 id="how-title">O sorteio é à moda antiga.</h2><p>Baralhamos os cartões, tiramos um nome e guardamos o segredo. Aqui, partilhamos as pistas para encontrar o presente certo.</p><p className={styles.howLink}><Icon name="heart" size={14} /> És da família? Abre a ligação privada que recebeste do organizador para editar os teus desejos. Perdeste-a? Pede uma nova ao organizador.</p></div>
        <Icon name="sparkles" size={48} className={styles.howStar} />
      </section>
    </main>
  );
}

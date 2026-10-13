import { FamilyDirectory } from "@/components/family-directory";
import { Icon } from "@/components/icon";
import { formatBudget, formatExchangeDate } from "@/lib/sample-data";
import { getStore } from "@/lib/db";
import styles from "./page.module.css";

function ChristmasIllustration() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <span className={styles.bigStar}>✳</span><span className={styles.smallStar}>✧</span><span className={styles.dot} />
      <div className={styles.orbit} />
      <div className={styles.wishCard}>
        <span className={styles.cardHole} />
        <span className={styles.cardEyebrow}>PARA ALGUÉM ESPECIAL</span>
        <span className={styles.cardTree}>✳</span>
        <span className={styles.cardTitle}>Feito de<br /><em>carinho.</em></span>
        <span className={styles.cardLine} /><Icon name="heart" size={15} />
      </div>
      <div className={styles.gift}><span className={styles.giftRibbon} /><span className={styles.giftLid} /><span className={styles.bowLeft} /><span className={styles.bowRight} /></div>
      <span className={styles.handwritten}>os melhores presentes<br />começam num detalhe <span>↗</span></span>
    </div>
  );
}

export default function Home() {
  const family = getStore().getFamily();
  const members = getStore().listMembers();
  return (
    <main id="conteudo" className="container">
      <section className={styles.hero} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">{family.name.toLocaleUpperCase("pt-PT")} · {family.year}</p>
          <h1 id="welcome-title">Pequenos desejos,<br />grandes <em>sorrisos.</em></h1>
          <p className={styles.welcome}>{family.welcome}</p>
          <a className="button" href="#familia">Descobrir os desejos <Icon name="arrow" size={18} /></a>
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
      <FamilyDirectory members={members} />
      <section className={styles.howItWorks} aria-labelledby="how-title">
        <div className={styles.howIcon}><Icon name="gift" size={29} /></div>
        <div><p className="eyebrow">A TRADIÇÃO CONTINUA</p><h2 id="how-title">O sorteio é à moda antiga.</h2><p>Baralhamos os cartões, tiramos um nome e guardamos o segredo. Aqui, partilhamos as pistas para encontrar o presente certo.</p></div>
        <span className={styles.howStar} aria-hidden="true">✳</span>
      </section>
    </main>
  );
}

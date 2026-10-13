import Link from "next/link";
import { Icon } from "@/components/icon";
import styles from "./not-found.module.css";

export default function NotFound() {
  return <main id="conteudo" className={`container ${styles.empty}`}><Icon name="gift" size={40} /><p className="eyebrow">ESTE PRESENTE PERDEU-SE PELO CAMINHO</p><h1>Página não encontrada.</h1><p>O endereço pode estar incorreto ou este perfil já não estar disponível.</p><Link href="/" className="button"><Icon name="back" size={17} />Voltar à família</Link></main>;
}

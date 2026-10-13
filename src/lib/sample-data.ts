import type { Family, Member } from "./types";

/** Fictional, explicitly seeded preview content; live pages read the database. */
export const family: Family = {
  name: "O nosso Natal",
  year: 2026,
  welcome: "Um cantinho para partilhar desejos, descobrir ideias e tornar o Natal ainda mais nosso.",
  exchangeDate: "2026-12-25",
  budget: { amount: 25, currency: "EUR" },
};

export const members: Member[] = [
  {
    id: "m-001", name: "Sofia", avatar: "sofia", colour: "peach",
    introduction: "Um livro, um chá e uma tarde sem pressas.",
    interests: ["Livros", "Chá", "Cerâmica"],
    wishes: [
      { id: "w-001", title: "Um livro para me perder", note: "Gosto de romances e histórias de viagens. Uma dedicatória torna tudo melhor." },
      { id: "w-002", title: "Uma caneca feita à mão", note: "Daquelas um bocadinho imperfeitas, em tons de verde ou areia." },
      { id: "w-003", title: "Chá para os dias frios", note: "Chá preto ou uma mistura com canela. Adoro experimentar sabores novos." },
    ],
    likes: ["Verde-azeitona", "Chocolate negro", "Coisas feitas à mão"],
    avoid: ["Velas perfumadas", "Bijuteria"],
    sizes: [{ label: "Roupa", value: "M · prefiro cortes largos" }, { label: "Calçado", value: "38" }],
    note: "Não é preciso ser nada de especial. Se te fez lembrar de mim, já é um bom presente. ♡",
  },
  {
    id: "m-002", name: "Miguel", avatar: "miguel", colour: "sage",
    introduction: "Sempre pronto para um café e uma aventura.",
    interests: ["Café", "Caminhadas", "Música"],
    wishes: [
      { id: "w-004", title: "Café de uma torra local", note: "Em grão, de preferência. Gosto de descobrir pequenos produtores." },
      { id: "w-005", title: "Meias para caminhadas", note: "Confortáveis e resistentes. Nada melhor para o próximo passeio." },
    ],
    likes: ["Café de especialidade", "Verde-escuro", "Música ao vivo"],
    avoid: ["Perfumes", "Canecas — já tenho muitas!"],
    sizes: [{ label: "Roupa", value: "L" }, { label: "Calçado", value: "43" }],
    note: "Também aceito um passeio em boa companhia.",
  },
  {
    id: "m-003", name: "Inês", avatar: "ines", colour: "lavender",
    introduction: "A colecionar ideias e pequenos momentos.",
    interests: ["Ilustração", "Plantas", "Fotografia"],
    wishes: [
      { id: "w-006", title: "Um caderno de desenho", note: "Papel mais grosso para desenhar com aguarela." },
      { id: "w-007", title: "Uma plantinha nova", note: "Uma fácil de cuidar para pôr junto à janela." },
    ],
    likes: ["Lilás", "Papelaria", "Postais ilustrados"],
    avoid: ["Flores artificiais"],
    note: "Um postal desenhado por ti vale tanto como um presente.",
  },
  {
    id: "m-004", name: "João", avatar: "joao", colour: "sand",
    introduction: "O próximo jantar fica por minha conta.",
    interests: ["Cozinha", "Jogos", "Cinema"],
    wishes: [
      { id: "w-008", title: "Um jogo para levar à mesa", note: "Simples de aprender e divertido para jogar em família." },
      { id: "w-009", title: "Temperos para experimentar", note: "Gosto de cozinhar pratos de outros países." },
    ],
    likes: ["Receitas novas", "Jogos de cartas", "Azul-marinho"],
    avoid: ["Álcool", "Objetos só decorativos"],
    sizes: [{ label: "Roupa", value: "L" }],
  },
  {
    id: "m-005", name: "Ana", avatar: "ana", colour: "rose",
    introduction: "As melhores prendas têm uma história.",
    interests: ["Jardinagem", "Cozinha", "Viagens"],
    wishes: [{ id: "w-010", title: "Sementes para a primavera", note: "Flores ou ervas aromáticas para a varanda." }],
    likes: ["Presentes caseiros", "Rosa velho", "Compotas"],
    avoid: [],
    note: "Uma fotografia nossa numa moldura também me fazia muito feliz.",
  },
  {
    id: "m-006", name: "Tomás", avatar: "tomas", colour: "blue",
    introduction: "Ainda estou a preparar a minha lista…",
    interests: ["Desporto", "Tecnologia"],
    wishes: [], likes: [], avoid: [],
  },
];

export function formatBudget(budget: NonNullable<Family["budget"]>): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency", currency: budget.currency, minimumFractionDigits: Number.isInteger(budget.amount) ? 0 : 2, maximumFractionDigits: 2,
  }).format(budget.amount);
}

export function formatExchangeDate(date: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "long", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

/*
  # Create DISC Assessment Questions

  1. New Tables
    - `disc_questions`
      - `id` (uuid, primary key)
      - `question_number` (integer)
      - `question_text` (text)
      - `option_d` (text) - Dominance option
      - `option_i` (text) - Influence option
      - `option_s` (text) - Stability option
      - `option_c` (text) - Conformity option
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `disc_questions` table
    - Add policy for authenticated users to read questions
*/

-- Create disc_questions table
CREATE TABLE IF NOT EXISTS disc_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_number integer NOT NULL,
    question_text text NOT NULL,
    option_d text NOT NULL,
    option_i text NOT NULL,
    option_s text NOT NULL,
    option_c text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE disc_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading questions
CREATE POLICY "Anyone can read disc questions"
    ON disc_questions FOR SELECT
    USING (true);

-- Insert DISC questions
INSERT INTO disc_questions (question_number, question_text, option_d, option_i, option_s, option_c) VALUES
(1, 'Em um ambiente de trabalho, eu geralmente sou:', 'Direto e decisivo', 'Amigável e colaborativo', 'Paciente e cooperativo', 'Preciso e analítico'),
(2, 'Quando enfrento um desafio, eu:', 'Tomo a iniciativa rapidamente', 'Procuro envolver outras pessoas', 'Mantenho a calma e sigo o processo', 'Analiso todas as opções cuidadosamente'),
(3, 'Na comunicação com outros, eu prefiro:', 'Ir direto ao ponto', 'Ser expressivo e animado', 'Ser diplomático e gentil', 'Ser preciso e detalhista'),
(4, 'Sob pressão, eu tendo a:', 'Tornar-me mais assertivo e direto', 'Falar mais e expressar preocupações', 'Buscar estabilidade e manter a calma', 'Focar em detalhes e análise'),
(5, 'Ao tomar decisões importantes, eu:', 'Decido rapidamente com base nos resultados', 'Considero o impacto nas pessoas', 'Busco consenso e harmonia', 'Analiso todas as variáveis possíveis'),
(6, 'Em reuniões, eu geralmente:', 'Lidero a discussão e tomo decisões', 'Compartilho ideias e energizo o grupo', 'Ouço atentamente e apoio outros', 'Tomo notas e avalio informações'),
(7, 'Quando surge um conflito, eu:', 'Enfrento-o diretamente', 'Tento mediar e aliviar tensões', 'Busco compromisso e acordo', 'Procuro fatos e evito emoções'),
(8, 'Meu espaço de trabalho geralmente é:', 'Organizado para eficiência', 'Decorado e acolhedor', 'Confortável e funcional', 'Extremamente organizado'),
(9, 'Em projetos novos, eu prefiro:', 'Assumir a liderança e definir direções', 'Gerar entusiasmo e novas ideias', 'Estabelecer rotinas e processos', 'Criar planos detalhados e cronogramas'),
(10, 'Quando recebo feedback, eu geralmente:', 'Quero saber os resultados concretos', 'Aprecio elogios e reconhecimento', 'Prefiro conversas construtivas e suporte', 'Busco detalhes específicos e dados'),
(11, 'Em situações de mudança, eu:', 'Abraço a mudança e lidero o processo', 'Promovo a mudança com entusiasmo', 'Adapto-me gradualmente e com cautela', 'Avalio os impactos detalhadamente'),
(12, 'Quando trabalho em equipe, eu:', 'Assumo naturalmente a liderança', 'Mantenho o grupo motivado', 'Ajudo a manter a harmonia', 'Cuido da qualidade e prazos'),
(13, 'Minha principal motivação é:', 'Alcançar resultados e vencer desafios', 'Ser reconhecido e influenciar pessoas', 'Criar estabilidade e ajudar outros', 'Garantir precisão e qualidade'),
(14, 'Ao explicar algo complexo, eu:', 'Vou direto aos pontos principais', 'Uso histórias e exemplos práticos', 'Explico passo a passo com paciência', 'Forneço todos os detalhes técnicos'),
(15, 'Em momentos de estresse, eu:', 'Torno-me mais direto e controlador', 'Expresso emoções abertamente', 'Busco apoio e estabilidade', 'Foco em fatos e análise'),
(16, 'Na resolução de problemas, eu prefiro:', 'Tomar ação imediata', 'Discutir soluções em grupo', 'Considerar abordagens testadas', 'Analisar todas as alternativas'),
(17, 'Quando estabeleço metas, eu:', 'Defino objetivos ambiciosos', 'Compartilho visões inspiradoras', 'Estabeleço metas realistas e graduais', 'Crio planos detalhados e métricas'),
(18, 'Em apresentações, eu costumo:', 'Ser direto e focado em resultados', 'Ser carismático e envolvente', 'Ser calmo e bem preparado', 'Ser metódico e detalhista'),
(19, 'Quando recebo uma tarefa nova, eu:', 'Começo imediatamente', 'Discuto ideias com outros', 'Sigo as instruções cuidadosamente', 'Planejo cada etapa'),
(20, 'Em relação a regras, eu:', 'Questiono as que limitam resultados', 'Adapto-as para melhor interação', 'Sigo-as consistentemente', 'Asseguro que sejam cumpridas'),
(21, 'Na gestão do tempo, eu:', 'Priorizo resultados rápidos', 'Mantenho flexibilidade', 'Mantenho uma rotina estável', 'Sigo cronogramas precisos'),
(22, 'Em networking, eu:', 'Foco em conexões estratégicas', 'Conecto-me facilmente com todos', 'Construo relações duradouras', 'Mantenho contatos profissionais'),
(23, 'Ao receber críticas, eu:', 'Respondo diretamente', 'Tento manter o ambiente leve', 'Procuro entender e me adaptar', 'Analiso os pontos levantados'),
(24, 'Em brainstormings, eu:', 'Foco em soluções práticas', 'Gero muitas ideias novas', 'Construo sobre ideias existentes', 'Avalio a viabilidade das ideias');

-- Create index for better performance
CREATE INDEX idx_disc_questions_number ON disc_questions(question_number);
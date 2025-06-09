CREATE DATABASE projeto_EB;
USE projeto_EB;

-- Tabela de perfis de usuário
CREATE TABLE perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL -- Ex: "Usuário OM", "Usuário Técnico", "Comando"
);

INSERT INTO perfis (nome) VALUES 
	("Usuário da OM"),
    ("Usuário Técnico"),
	("Usuário Comando");
    
SELECT * FROM perfis;

-- Tabela de funções técnicas
CREATE TABLE funcoes_tecnicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE -- Ex: "Chefe COAL", "Cmt Pelotão"
);

INSERT INTO funcoes_tecnicas (nome) VALUES
('Chefe COAL'),
('Cmt Pelotão'),
('Especialista Técnico'),
('Chefe de Seção');

SELECT * FROM funcoes_tecnicas;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
);

ALTER TABLE usuarios
ADD COLUMN funcao_tecnica_id INT DEFAULT NULL,
ADD FOREIGN KEY (funcao_tecnica_id) REFERENCES funcoes_tecnicas(id);

SELECT * FROM usuarios;
-- DELETE FROM usuarios WHERE id > 0;

-- Tabela de categorias de chamados
CREATE TABLE categorias_chamado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL -- Ex: "Dúvida técnica", "Solicitação de valores", etc.
);

INSERT INTO categorias_chamado (nome) VALUES ("Dúvida Geral");

-- Tabela de chamados
CREATE TABLE chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    categoria_id INT NOT NULL,
    criado_por INT NOT NULL,
    atribuido_para INT DEFAULT NULL,
    status ENUM('aberto', 'em_andamento', 'concluido', 'fechado') DEFAULT 'aberto',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_chamado(id),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id),
    FOREIGN KEY (atribuido_para) REFERENCES usuarios(id)
);

SELECT * FROM chamados;

ALTER TABLE chamados
  DROP FOREIGN KEY chamados_ibfk_3,  -- remove FK de atribuido_para
  DROP COLUMN atribuido_para,        -- remove a coluna
  ADD COLUMN atribuido_funcao_tecnica_id INT DEFAULT NULL,
  ADD FOREIGN KEY (atribuido_funcao_tecnica_id) REFERENCES funcoes_tecnicas(id);

-- Tabela de mensagens/respostas nos chamados
CREATE TABLE respostas_chamado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT NOT NULL,
    autor_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chamado_id) REFERENCES chamados(id),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);
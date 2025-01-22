CREATE TABLE forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  partner_name VARCHAR(255),
  expected_participants INT,
  published BOOLEAN DEFAULT FALSE,
  publish_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  title VARCHAR(255) NOT NULL,
  type ENUM('multiple-choice', 'checkbox', 'short-answer', 'paragraph') NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  option_text VARCHAR(255) NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE answer_texts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT,
  question_id INT,
  answer_text TEXT,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE answer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT,
  question_id INT,
  option_id INT,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
);


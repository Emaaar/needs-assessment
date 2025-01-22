CREATE TABLE IF NOT EXISTS forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  partner_name VARCHAR(255),
  expected_participants INT,
  published BOOLEAN DEFAULT FALSE,
  publish_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  title VARCHAR(255) NOT NULL,
  type ENUM('short-answer', 'paragraph', 'multiple-choice', 'checkbox') NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  option_text VARCHAR(255) NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer_texts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT,
  question_id INT,
  answer_text TEXT,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT,
  question_id INT,
  option_id INT,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expected_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  question_id INT,
  expected_value JSON,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

Create the responses table
CREATE TABLE IF NOT EXISTS responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Create the question_responses table
CREATE TABLE IF NOT EXISTS question_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT,
  question_id INT,
  answer TEXT,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);


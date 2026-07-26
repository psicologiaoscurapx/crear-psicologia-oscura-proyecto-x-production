const app = document.getElementById("app");

app.innerHTML = `
  <header class="header">
    <div class="logo">Psicología Oscura</div>

    <nav class="nav">
      <button onclick="showHome()">Inicio</button>
      <button onclick="showBooks()">Ebooks</button>
      <button onclick="showAbout()">Nosotros</button>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h1>Psicología Oscura Proyecto X</h1>

      <p>
        Explora nuestra colección de ebooks y descubre contenidos
        relacionados con psicología, comportamiento humano y desarrollo personal.
      </p>

      <button class="primary-button" onclick="showBooks()">
        Explorar ebooks
      </button>
    </section>

    <section class="container" id="content">
    </section>
  </main>

  <footer class="footer">
    <p>© 2026 Psicología Oscura Proyecto X</p>
  </footer>
`;

function showHome() {
  document.getElementById("content").innerHTML = `
    <h2>Bienvenido</h2>
    <p style="margin-top: 15px; color: #aaa;">
      Bienvenido a nuestra plataforma de contenido digital.
    </p>
  `;
}

function showBooks() {
  document.getElementById("content").innerHTML = `
    <h2>Nuestros Ebooks</h2>

    <div class="books-grid">

      <div class="book-card">
        <h3>El Código de la Seducción</h3>
        <p>
          Descubre conceptos y estrategias relacionadas con la atracción
          y el comportamiento humano.
        </p>
        <br>
        <button
  class="primary-button"
  onclick="window.location.href='ebook1.html'">
  Ver ebook
</button>
        </button>
      </div>

      <div class="book-card">
        <h3>El Sabio Oscuro de la Psicología</h3>
        <p>
          Explora conceptos de psicología y comportamiento desde una
          perspectiva diferente.
        </p>
        <br>
        <button class="primary-button">
          Ver ebook
        </button>
      </div>

      <div class="book-card">
        <h3>El Tablero de Carne</h3>
        <p>
          Una colección de contenido para quienes desean profundizar
          en el análisis del comportamiento humano.
        </p>
        <br>
        <button class="primary-button">
          Ver ebook
        </button>
      </div>

    </div>
  `;
}

function showAbout() {
  document.getElementById("content").innerHTML = `
    <h2>Sobre el proyecto</h2>

    <p style="margin-top: 15px; color: #aaa; line-height: 1.6;">
      Psicología Oscura Proyecto X es una plataforma digital
      enfocada en contenido relacionado con psicología y comportamiento humano.
    </p>
  `;
}

showHome();

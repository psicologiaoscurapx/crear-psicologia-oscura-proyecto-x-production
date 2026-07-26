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
        Explora nuestra colección de ebooks y descubre contenidos relacionados
        con psicología y comportamiento humano.
    </p>

    <button class="primary-button" onclick="showBooks()">
        Explorar ebooks
    </button>
</section>

<section id="content" class="container"></section>

</main>

<footer class="footer">
    © 2026 Psicología Oscura Proyecto X
</footer>
`;

function showHome(){

document.getElementById("content").innerHTML=`

<h2>Bienvenido</h2>

<p style="margin-top:15px;color:#aaa;">
Bienvenido a nuestra plataforma.
</p>

`;

}

function showBooks(){

document.getElementById("content").innerHTML=`

<h2>Nuestros Ebooks</h2>

<div class="books-grid">

<div class="book-card">

<h3>El Código de la Seducción</h3>

<p>
Descubre conceptos y estrategias relacionadas con la atracción y el comportamiento humano.
</p>

<button class="primary-button"
onclick="window.location.href='ebook1.html'">
Ver ebook
</button>

</div>

<div class="book-card">

<h3>El Sabio Oscuro de la Psicología</h3>

<p>
Próximamente disponible.
</p>

<button class="primary-button" disabled>
Próximamente
</button>

</div>

<div class="book-card">

<h3>El Tablero de Carne</h3>

<p>
Próximamente disponible.
</p>

<button class="primary-button" disabled>
Próximamente
</button>

</div>

</div>

`;

}

function showAbout(){

document.getElementById("content").innerHTML=`

<h2>Sobre Nosotros</h2>

<p style="margin-top:15px;color:#aaa;line-height:1.7;">
Psicología Oscura Proyecto X es una plataforma enfocada en contenido digital
sobre comportamiento humano y desarrollo personal.
</p>

`;

}

showHome();

let emojis = document.querySelector("#emojis");
let contenedorEmojis = document.querySelector("#contenedorEmojis")
let contEmoji = document.getElementsByClassName("emoji")
const chat1 = document.querySelector('#barra-escribir');

for(let i = 0 ; i< contEmoji.length ; i ++){
    contEmoji[i].addEventListener("click",crearEmoji)
}


function crearEmoji(e){
    chat1.value += e.target.innerHTML
}
emojis.addEventListener("click",function(e){
    contenedorEmojis.style.display == "inline-grid" ? contenedorEmojis.style.display = "none":contenedorEmojis.style.display = "inline-grid"
    contenedorEmojis.style.left = `${e.clientX -330}px`
    contenedorEmojis.style.top = `${e.clientY -345}px`
})
const signup = document.querySelector("#signup")
const login = document.querySelector("#login")
const espacio = document.querySelector("#space-blank")
const espacio1 = document.querySelector("#space-blank1")





function iniciarS(e){
    e.preventDefault()
    espacio1.style.opacity = "1";
    espacio1.style.zIndex = "0";
    espacio1.addEventListener("click",retroceder);
}
function registrate(e){
    e.preventDefault()
    espacio.style.opacity = "1";
    espacio.style.zIndex = "0";
    espacio.addEventListener("click",retroceder);
}
function retroceder(e){
    let contenedor = e.target   
    if(contenedor.getAttribute("id") == "space-blank" ){
        espacio.style.opacity = "0";
        espacio.style.zIndex = "-30";
        espacio.removeEventListener("click",retroceder)
    }
    else if(contenedor.getAttribute("id") == "space-blank1"){
        espacio1.style.opacity = "0";
        espacio1.style.zIndex = "-30";
        espacio1.removeEventListener("click",retroceder)
    }
    
}




signup.addEventListener("click", registrate)
login.addEventListener("click", iniciarS)
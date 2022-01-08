const chat = document.querySelector('#barra-escribir');
const conversaciones = document.getElementsByClassName('conversaciones')
const usuario = document.querySelector('#usuario');
const usuarioPri = document.querySelector('#usuarioPrueba').textContent
const contChat = document.querySelector('#cont-chat');
const contenedorChat = document.querySelector('#cont-chat');
const socket = io();
let usuario2 ;
let amigos = []


for(let i = 0; i < conversaciones.length; i++){ 
    
    amigos.push(conversaciones[i].children[1].children[0].textContent.trim())
    conversaciones[i].addEventListener("click",chats)
}
console.log(amigos)
socket.emit("datos:server",{amigos:amigos,user:usuarioPri})

function chats(e){
    let nomPerso = e.target
    let nomusuario = this.children[1].children[0].textContent.trim()
    usuario2 = nomusuario
    console.log(usuarioPri)
    contChat.innerHTML = "";


        fetch('/encontrar', {
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                                  usuario:nomusuario,
                                  usuarioPri:usuarioPri
                                 })
            
        }).then(res =>{return res.json()})
        .then(data =>{            
            data.principal.map(elements =>{
                let contenedor = document.createElement('div');
                let contenedorTexto = document.createElement('div');
                let contenedorFecha = document.createElement('div');
                let parrafoTexto = document.createElement('p');
                let parrafoFecha = document.createElement('p');
                

                if(elements.direccion == "0"){
                    contenedor.setAttribute('class','cont-mensaje-left')   
                }
                else{
                    contenedor.setAttribute('class','cont-mensaje')   
                }
                parrafoTexto.setAttribute('class','cont-mensaje-texto')
                contChat.appendChild(contenedor);
                contenedor.appendChild(contenedorTexto);
                contenedor.appendChild(contenedorFecha);
                contenedorTexto.appendChild(parrafoTexto);
                contenedorFecha.appendChild(parrafoFecha); 

                parrafoTexto.textContent += elements.texto
            })
            console.log(contChat)
            console.log(contChat.innerHTML)
            
            contenedorChat.scrollTop = contenedorChat.scrollHeight;
        });
    
}

socket.on('enviar:user',async (data)=>{
    
    //verficar si solo debo pasarle data
    console.log(data.data1.usuario)
    console.log(usuario2)
    
    if( usuario2 == data.data1.usuario){
        
        await fethEnviar(data.data1.texto,1)
        contenedorChat.scrollTop = contenedorChat.scrollHeight;
    }
    else if(usuario2 == null || usuario2 != data.usuario || usuario2 == undefined){
        
        for(let i = 0;  i < conversaciones.length ; i ++){

            let nameUser = conversaciones[i].children[1].children[0].textContent.trim() 

            if(nameUser == data.data1.usuario){

               conversaciones[i].children[1].children[1].children[0].innerText = data.data1.texto;
            }
        }
        // save dates in json 
        socket.emit('guardar', data.data1)
        // estilizar mejor eso  
    }

})

async function enviar(e){
    let key = e.target
    
    
    if(e.charCode == "13"){
        
        let data  = await fethEnviar(chat.value)
        
        data.usuario2 = usuario2
        console.log(data)
        socket.emit('enviar', data)   
        chat.value = ""; 
        contenedorChat.scrollTop = contenedorChat.scrollHeight;
    }
}


async function fethEnviar(texto, direccion = undefined){
    let message ;
    await fetch('/enviar', {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({usuario:usuario2,
                              texto:texto,
                              usuarioPri:usuarioPri,
                              direccion : direccion
                             })
    })
     .then(res =>{return res.json()})
     .then(data =>{
        console.log(data)
        if(direccion == 1){
            data.direccion = '0';
        }
        //let tamaño = data.principal.length
        let contenedor = document.createElement('div');
        let contenedorTexto = document.createElement('div');
        let contenedorFecha = document.createElement('div');
        let parrafoTexto = document.createElement('p');
        let parrafoFecha = document.createElement('p');
        
        console.log(data.direccion)
        if(data.direccion == "0"){
            contenedor.setAttribute('class','cont-mensaje-left')   
        }
        else{
            contenedor.setAttribute('class','cont-mensaje')   
        }
        parrafoTexto.setAttribute('class','cont-mensaje-texto')
        contChat.appendChild(contenedor);
        contenedor.appendChild(contenedorTexto);
        contenedor.appendChild(contenedorFecha);
        contenedorTexto.appendChild(parrafoTexto);
        contenedorFecha.appendChild(parrafoFecha); 

        parrafoTexto.textContent += data.texto;

        message = data ;
    })
    return message
}
chat.addEventListener("focus",(e) =>{
    chat.addEventListener("keypress",enviar)
})

chat.addEventListener('focusout', ()=>{
    // revisar esto por  que aqui deberia eliminar el listener
    alert("sale del focus");
})


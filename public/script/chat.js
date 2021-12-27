const chat = document.querySelector('#barra-escribir');
const conversaciones = document.getElementsByClassName('conversaciones')
const usuario = document.querySelector('#usuario');
const usuarioPri = document.querySelector('#usuarioPrueba').textContent
const contChat = document.querySelector('#cont-chat');
const socket = io();
let usuario2 ;

for(let i = 0; i < conversaciones.length; i++){
    conversaciones[i].addEventListener("click",chats)
}



function chats(e){
    let nomPerso = e.target
    let nomusuario = this.textContent.trim()
    usuario2 = nomusuario
    console.log(usuarioPri)
    

    socket.emit('sala', {user: usuario2})

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
            
        });
    
}

socket.on('enviar:user',(data)=>{
    
    //verficar si solo debo pasarle data
    console.log(data.data1.usuario)
    console.log(usuario2)
    
    if( usuario2 == data.data1.usuario){
        
        fethEnviar(data.data1.texto)
        // aqui si mandar el fetch de enviar y actualizar
    }
    else if(usuario2 == null || usuario2 != data.usuario){

        //ponemos el ultimo mensaje enviado en la parte izquierda y guardamos los datos en el json 
    }

    //fethEnviar(data)
})

async function enviar(e){
    let key = e.target
    
    
    if(e.charCode == "13"){
        
        let data  = await fethEnviar(chat.value)
        console.log(data)
        data.usuario2 = usuario2
        socket.emit('enviar', data)   
    }
}


async function fethEnviar(texto){
    let message ;
    await fetch('/enviar', {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({usuario:usuario2,
                              texto:texto,
                              usuarioPri:usuarioPri
                             })
    })
     .then(res =>{return res.json()})
     .then(data =>{
        console.log(data)
        //let tamaño = data.principal.length
        let contenedor = document.createElement('div');
        let contenedorTexto = document.createElement('div');
        let contenedorFecha = document.createElement('div');
        let parrafoTexto = document.createElement('p');
        let parrafoFecha = document.createElement('p');
        

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


window.addEventListener("load", (e)=>{
    const chat = document.querySelector('#barra-escribir');
    const conversaciones = document.getElementsByClassName('conversaciones')
    const usuario = document.querySelector('#usuario');
    const usuarioPri = document.querySelector('#usuarioPrueba').textContent
    const contChat = document.querySelector('#cont-chat');
    const contenedorChat = document.querySelector('#cont-chat');
    const socket = io();
    let usuario2 ;
    let amigos = []
    let db ;
    let solicitudConexion = indexedDB.open('contactosdb',2);
    let fecha = new Date;
    solicitudConexion.onsuccess = (e)=>{
        db = e.target.result;
    }

    solicitudConexion.onerror = (e)=>{
        console.log(e.target.errorCode);
    }

    solicitudConexion.onupgradeneeded = (e)=>{
        db = e.target.result;

        let contactos = db.createObjectStore('contactos1')
    }

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
                
                // el resultado no lo muestra si no que busca los datos en la base de datos
                // del navegador y  hay si recorrelos y mostrarlos 
                let transaccion = db.transaction(['contactos1'],'readwrite')
                let  notas = transaccion.objectStore('contactos1')

                let prueba = notas.get(data.idchat)

                prueba.onsuccess = function(e){
                    let data1 = prueba.result
                    if(data1 != undefined){
                        console.log(data1)
                        console.log(data1)

                        data1.contenido.map(elements =>{

                            console.log(elements)
                        let contenedor = document.createElement('div');
                        let contenedorTexto = document.createElement('div');
                        let contenedorFecha = document.createElement('div');
                        let parrafoTexto = document.createElement('p');
                        let parrafoFecha = document.createElement('p');
                        

                        if(elements.usuario != usuarioPri){
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

                        contenedorChat.scrollTop = contenedorChat.scrollHeight;
                    })
                }
                else{
                        let chat = {
                            idChat : data.idchat,
                                contenido:[]      
                        }

                        notas.add(chat,data.idchat)
                    }
                    
                }
 
                
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
            
        }

    })

    async function enviar(e){
        let key = e.target
        
        
        if(e.charCode == "13"){
            
            let data  = await fethEnviar(chat.value)
            // solucionar este erro y verificar que todo funcione; bien 
            // arreglar lo de las dirreciones
            console.log(data)
            console.log(usuarioPri)
            data.usuario2 = usuario2
            data.usuario = usuarioPri
            
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
        .then(async (data) =>{
            console.log(data)
            
            let transaccion = db.transaction(['contactos1'],'readwrite')
            let  notas = transaccion.objectStore('contactos1')
             
            let chatSelecionado =  notas.get(data.idchat)

               chatSelecionado.onsuccess =   (e)=>{
                let messages = chatSelecionado.result

                console.log(messages);
                let mensajeaGuardar = {
                    texto:data.texto,
                    fecha:fecha.getHours(),
                    usuario: usuarioPri 
                }
                messages.contenido.push(mensajeaGuardar);
                 
                console.log(messages)

                let enviarMensaje =  notas.put(messages,data.idchat)
                    enviarMensaje.onsuccess = (e)=>{

                        
                        //let tamaño = data.principal.length
                        let contenedor = document.createElement('div');
                        let contenedorTexto = document.createElement('div');
                        let contenedorFecha = document.createElement('div');
                        let parrafoTexto = document.createElement('p');
                        let parrafoFecha = document.createElement('p');
                        if(direccion == 1){
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
            
                        contenedorChat.scrollTop = contenedorChat.scrollHeight;
                    }
             }
            
                

                
            

             message = data ;  
        })
         return message
    }
    chat.addEventListener("focus",(e) =>{
        chat.addEventListener("keypress",enviar)
    })

    chat.addEventListener('focusout', ()=>{
        // revisar esto por  que aqui deberia eliminar el listener
        chat.removeEventListener("keypess",enviar)
    })
})




window.addEventListener("load", (e)=>{
    
    const chat = document.querySelector('#barra-escribir');
    const conversaciones = document.getElementsByClassName('conversaciones')
    const usuario = document.querySelector('#usuario');
    const usuarioPri = document.querySelector('#usuarioPrueba').textContent
    const contChat = document.querySelector('#cont-chat');
    const contenedorChat = document.querySelector('#cont-chat');
    const botonAudio = document.querySelector('#botonAudio'); 
    const enviarAudio = document.querySelector('#enviarAudio')
    const audio = document.querySelector("#audio");
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


    socket.emit("datos:server",{amigos:amigos,user:usuarioPri})
    
    socket.on('guardar:dbLocal',(data)=>{

        let transaccion = db.transaction(['contactos1'],'readwrite')
        let  notas = transaccion.objectStore('contactos1')
             
        let chatSelecionado =  notas.get(data.idchat)


         chatSelecionado.onsuccess =   (e)=>{
            let messages = chatSelecionado.result
            if(messages == undefined){
  
                let chat = {
                    idChat : data.idchat,
                    contenido:[]      
                        }
                
                let agregarDatosdb = notas.add(chat,data.idchat)

                agregarDatosdb.onsuccess = (e)=>{
                    let rescatarDatos =  notas.get(data.idchat)

                    rescatarDatos.onsuccess =   (e)=>{

                        let mensajeRescatado = rescatarDatos.result
                        let RescatarArregloMensajes = data.message.split(";!")
                        RescatarArregloMensajes.map(elements =>{

                            let mensajeTexto = elements
                         
                            if(mensajeTexto.length != 0){
                                console.log(elements)
                                if(typeof mensajeTexto.texto != "object"){
                                    mensajeTexto = JSON.parse(mensajeTexto);
                                }
                                
                                mensajeRescatado.contenido.push(mensajeTexto);        
                            }                                  
                        }) 

                        notas.put(mensajeRescatado,data.idchat)
                    }
                }             
            }
            else{
                let arregloMensajes = data.message.split(";!")
                arregloMensajes.map(elements =>{

                    let mensajeTexto = elements
                         
                    if(mensajeTexto.length != 0){  
                        
                        mensajeTexto = JSON.parse(mensajeTexto);
                        messages.contenido.push(mensajeTexto);         
                    }
     
                     notas.put(messages,data.idchat)
                }) 
            }          
        }
    })

    function chats(e){
        
        let nomusuario = this.children[1].children[0].textContent.trim()
        usuario2 = nomusuario
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
                
            let transaccion = db.transaction(['contactos1'],'readwrite')
            let  notas = transaccion.objectStore('contactos1')
            let prueba = notas.get(data.idchat)

            prueba.onsuccess = function(e){
                let data1 = prueba.result
                if(data1 != undefined){
                    let direccion = 0;
                    data1.contenido.map(async (elements) =>{
                        if(typeof elements.texto == "object"){
                            elements.usuario != usuarioPri? direccion = 1 : direccion = 0;
                            crearAudios(elements.texto[0],direccion)
                            return; 
                        } 

                        elements.usuario != usuarioPri?direccion = 1 : direccion = 0;
                        crearMensajeTexto(elements.texto,direccion) 
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
        
        if( usuario2 == data.data1.usuario){
            
            await fethEnviar(data.data1.texto,1) 
            contenedorChat.scrollTop = contenedorChat.scrollHeight;
        }
        else if(usuario2 == null || usuario2 != data.usuario || usuario2 == undefined){
            
            for(let i = 0;  i < conversaciones.length ; i ++){

                let nameUser = conversaciones[i].children[1].children[0].textContent.trim() 

                if(nameUser == data.data1.usuario){
                if(typeof data.data1.texto == "object"){
                    conversaciones[i].children[1].children[1].children[0].innerText = "audio"; 
                }
                else{
                    conversaciones[i].children[1].children[1].children[0].innerText = data.data1.texto;
                }
                
                socket.emit('guardar',{
                        texto:data.data1.texto,
                        usuario:data.data1.usuario,
                        usuario2: usuarioPri
                                    })
                }
            }
            
        }

    })

    async function enviar(e){
        let key = e.target
        
        
        if(e.charCode == "13"){
            
            let data  = await fethEnviar(chat.value)
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
                                usuarioPri:usuarioPri,
                                })
        })
        .then(res =>{return res.json()})
        .then(async (data) =>{

            let transaccion = db.transaction(['contactos1'],'readwrite')
            let  notas = transaccion.objectStore('contactos1')
             
            let chatSelecionado =  notas.get(data.idchat)

               chatSelecionado.onsuccess =   (e)=>{
                let messages = chatSelecionado.result

                let mensajeaGuardar = {
                    texto:texto,
                    fecha:fecha.getHours(),
                    usuario: usuarioPri 
                }
                messages.contenido.push(mensajeaGuardar);
                 

                let enviarMensaje =  notas.put(messages,data.idchat)
                    enviarMensaje.onsuccess = async (e)=>{    
                        if(typeof texto == "object"){
                            await crearAudios(texto[0],direccion)
                            return; 
                        }                    
                        crearMensajeTexto(texto,direccion)
                        
                    }
             }
             data.texto = texto;
             message = data ;  
        })
         return message
    }

    let mediaRecorder
    botonAudio.addEventListener("click",async (e)=>{

        botonAudio.style.display = "none";
        enviarAudio.style.display = "inline-block";

        let chunks = [];
        navigator.mediaDevices.getUserMedia({audio:true})
        .then((stream)=>{
            audio.srcObject = stream

             mediaRecorder = new MediaRecorder(stream,{  
                mimeType:"audio/webm"
            });

            mediaRecorder.start();

            mediaRecorder.ondataavailable = function(e){
                chunks.push(e.data);
            }
    
            mediaRecorder.onstop = async function(){
                alert("audio finalizado")
    
                let blob = new Blob(chunks,{type:"audio/mpeg"});
                chunks = [];
                              
    
                const base64String = await convertBlobToBase64(blob);

                let data  = await fethEnviar(base64String)
                data.usuario2 = usuario2
                data.usuario = usuarioPri
                socket.emit('enviar', data)   
                chat.value = "";  
                contenedorChat.scrollTop = contenedorChat.scrollHeight;
            }
        })        
    })

    const convertBlobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader;
        reader.onerror = reject;
        reader.onload = () => {
            resolve(reader.result.split(','[1]));
        };
        reader.readAsDataURL(blob);
    });



    enviarAudio.addEventListener("click",(e)=>{
        
        botonAudio.style.display = "inline-block";
        enviarAudio.style.display = "none";

        mediaRecorder.stop();
    })

    function crearMensajeTexto(texto,direccion = undefined){
        let contenedor = document.createElement('div');
        let contenedorTexto = document.createElement('div');
        let contenedorFecha = document.createElement('div');
        let parrafoTexto = document.createElement('p');
        let parrafoFecha = document.createElement('p');

        direccion == 1 ?contenedor.setAttribute('class','cont-mensaje-left'):contenedor.setAttribute('class','cont-mensaje');

        parrafoTexto.setAttribute('class','cont-mensaje-texto')
        contChat.appendChild(contenedor);
        contenedor.appendChild(contenedorTexto);
        contenedor.appendChild(contenedorFecha);
        contenedorTexto.appendChild(parrafoTexto);
        contenedorFecha.appendChild(parrafoFecha); 
                
        parrafoTexto.textContent += texto;        
        contenedorChat.scrollTop = contenedorChat.scrollHeight;
    }

     function crearAudios(response,direccion = undefined){
        let elementoDeAudio = document.createElement("audio")
        let elementoContenedor = document.createElement("div")
        let contenedorbtnAudio = document.createElement("div")
        let contenedorBarraAudio = document.createElement("div")
        let barraProgreso = document.createElement("input")
        let contenedorMinutos = document.createElement("div")
        let tiempoAudio = document.createElement("p")
        let btnAudio = document.createElement("i");
           
        direccion == 1 ? elementoContenedor.setAttribute('class','cont-mensaje-left'):elementoContenedor.setAttribute('class','cont-mensaje');

        contenedorBarraAudio.setAttribute("class","contenedor-barraAudio")
        contenedorbtnAudio.setAttribute("class","contenedor-audio")
        btnAudio.setAttribute("class","fas fa-play iconoAudio")                 
        barraProgreso.setAttribute("type","range")
        barraProgreso.setAttribute("id","rango") 
        contenedorMinutos.setAttribute("class","tiempoAudio")                   

        elementoContenedor.appendChild(contenedorbtnAudio)
        contenedorbtnAudio.appendChild(btnAudio)
        elementoContenedor.appendChild(contenedorMinutos)
        contenedorMinutos.appendChild(tiempoAudio)
        elementoContenedor.appendChild(contenedorBarraAudio)
        contenedorBarraAudio.appendChild(barraProgreso)
        contChat.appendChild(elementoContenedor)
        elementoContenedor.appendChild(elementoDeAudio);

        elementoDeAudio.src = `${response}`
            
        contenedorbtnAudio.addEventListener("click",reanudarYpausar)
        elementoDeAudio.currentTime = 3600;
    
        elementoDeAudio.onloadeddata = function(e){
            let tiempo = actualizarTiempo(elementoDeAudio.currentTime,elementoDeAudio.duration);
            tiempoAudio.innerText = tiempo;
            elementoDeAudio.currentTime = 0;
        }
        elementoDeAudio.ontimeupdate = ()=> {
            let tiempo = actualizarTiempo(elementoDeAudio.currentTime,elementoDeAudio.duration);
            let porsentaje = (100*elementoDeAudio.currentTime)/elementoDeAudio.duration
            tiempoAudio.innerText = tiempo;
            barraProgreso.value = porsentaje
            barraProgreso.style.background = `linear-gradient(90deg,rgb(75, 75, 75) ${barraProgreso.value}%,rgb(236, 236, 236) ${barraProgreso.value}%)`

            barraProgreso.onchange = ()=>{
                let moverBarra = (barraProgreso.value *elementoDeAudio.duration)/100;
                elementoDeAudio.currentTime = moverBarra
                barraProgreso.style.background = `linear-gradient(90deg,rgb(75, 75, 75) ${barraProgreso.value}%,rgb(236, 236, 236) ${barraProgreso.value}%)`
            }  
        }
        elementoDeAudio.addEventListener("ended", function(){
            elementoDeAudio.currentTime = 0;
            btnAudio.setAttribute("class","fas fa-play iconoAudio")
        });

        contenedorChat.scrollTop = contenedorChat.scrollHeight;
    }

    function actualizarTiempo(currentTime,duracion){
            let duracionAudio = new Date(duracion*1000) 
            let segundosDuracion = duracionAudio.getSeconds() <= 9 ? "0"+duracionAudio.getSeconds():duracionAudio.getSeconds();
            let minutosDuracion = duracionAudio.getMinutes() <=9 ? "0"+duracionAudio.getMinutes():duracionAudio.getMinutes();
            
            let d = new Date(currentTime*1000)
            let segundos = d.getSeconds() <=9 ?"0"+d.getSeconds():d.getSeconds();;
            let minutos = d.getMinutes()<=9 ? "0"+d.getMinutes():d.getMinutes();
            return`${minutos}:${segundos}/${minutosDuracion}:${segundosDuracion}`
    }

    function reanudarYpausar(e){
        
        elementoContenedor = e.target.parentElement
        
        let audioContenido = elementoContenedor.parentElement.querySelector("audio")
        if(audioContenido.paused){
            audioContenido.play()
            e.target.setAttribute("class","fas fa-pause iconoAudio")
        }
        else{
            audioContenido.pause()
            e.target.setAttribute("class","fas fa-play iconoAudio")
        } 
        
    }

    chat.addEventListener("focus",(e) =>{
        chat.addEventListener("keypress",enviar)
    })

    chat.addEventListener('focusout', ()=>{
        // revisar esto por  que aqui deberia eliminar el listener
        chat.removeEventListener("keypess",enviar)
    })
})




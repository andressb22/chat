
const path = require('path')
const soketIO =require("socket.io");
const passport = require('passport');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const pool = require('./database/db');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passportLocal = require('passport-local').Strategy
const fs = require('fs');

// en este arreglo se almacenas todos los usuarios que se conectan a travez de socket io
const clientes = {};
let usuarioPrincipal ;
let fecha = new Date;

const app = express();

app.use(express.urlencoded({extended:true}));

app.use(cookieParser('misecreto'))

app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())

passport.use(new passportLocal(async function(username,password,done){
    
    // busca en la base de datos si la secion existe 
    const usuarios = await pool.query(`SELECT * FROM usuarios WHERE username = '${username}'` )
    
    if(usuarios.rows.length == 0){
        done(null, false, { message: 'Incorrect username.' })
    }else{
        session.datos = {
            username :usuarios.rows[0].username,
            fullname : usuarios.rows[0].fullname
        }
        usuarioPrincipal = usuarios.rows[0]
        if(usuarios.rows[0].password == password)
        {
           return  done(null,usuarios.rows[0])
        }
    
        done(null,false)
    }
    
    
}))


passport.serializeUser(function(user,done){
    done(null,user.id);
})


passport.deserializeUser(function(id,done){
    done(null,id)
})

//3 ivocar i/o configurar a dotenv que son las variables de entorno 

dotenv.config({path:'./env/.env'});

//4 crear la carpeta de archivos estaticos o public
// express.static se usa para definir la carpera donde estaran los archivos estaticos
// y app.use es para invocar esa carpeta atraves de el nombre que esta puesto a modo de url

//app.use('/resources', express.static('public'))
app.use('/resources', express.static(path.join(__dirname, 'public')))
app.use('/resources', express.static(path.join(__dirname, '/public')))
//app.use('/resources', express.static(__dirname + '/public'))


//5) - Establecer el motor de plantillas
app.set('view engine', 'ejs');


const server = app.listen(process.env.PORT || 3000, (req,res)=>{})

const io = soketIO(server);


async function encontrarDatosDedb(usuario1,usuario2){
    let datosDeChat;
    datosDeChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${usuario1}' and 
        username2 = '${usuario2}'`)

    if(datosDeChat.rows.length == 0){
        datosDeChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${usuario2}' and 
                                       username2 = '${usuario1}'`);
            }

    return datosDeChat
}


io.on('connection',async (socket)=>{

    socket.on("guardar", async (data)=>{
        
        let datosMensaje ;
        if(typeof data.texto =="object"){
            datosMensaje ={message:`{"usuario": "${data.usuario}", "texto": ${JSON.stringify(data.texto)},"fecha":"${fecha.getHours()}"};!`,
            idchat:idchat} 
        }
        else{
            datosMensaje ={message:`{"usuario": "${data.usuario}", "texto": "${data.texto}","fecha":"${fecha.getHours()}"};!`,
                                        idchat:idchat}
        }
        let datosDeChat = await encontrarDatosDedb(data.usuario,data.usuario2);
        let idchat = datosDeChat.rows[0].idchat

        //funcion que guarda las conversaciones en el navegador usando indexdb
        socket.emit('guardar:dbLocal',datosMensaje);
    })

    socket.on('datos:server',async(data)=>{
           
        for(let i = 0; i < data.amigos.length; i++){
                 
            let datosDeChat = await encontrarDatosDedb(data.user,data.amigos[i]);

                if(datosDeChat.rows[0].username1 == data.user){

                    let data1 = datosDeChat.rows[0].change1;
                
                    if(data1 == 1){

                     let message = JSON.parse(JSON.stringify(datosDeChat.rows[0].message1))
                        socket.emit('guardar:dbLocal', {message:message,
                            idchat:datosDeChat.rows[0].idchat})

                        await pool.query(`UPDATE contactos SET change1 = '${0}' , message1 = ' ' WHERE 
                                        username1 = '${data.user}' AND username2 = '${data.amigos[i]}'`)
                    }
                }else{

                    let data1 = datosDeChat.rows[0].change2;
                    
                    if(data1 == 1){
                        let message = JSON.parse(JSON.stringify(datosDeChat.rows[0].message2))
                        socket.emit('guardar:dbLocal', {message:message,
                                                        idchat:datosDeChat.rows[0].idchat})

                        await pool.query(`UPDATE contactos SET change2 = '${0}' , message2 = ' ' WHERE
                                        username1 = '${data.amigos[i]}' AND username2 = '${data.user}'`)
                    }
                }                                           
        }
    })

    socket.on('enviar', async (data1)=>{          

        let texto;

        if(clientes[data1.usuario2] == undefined){
            console.log("usuario no conectado ")
         
            let datosDeChat = await encontrarDatosDedb(data1.usuario,data1.usuario2);
           
            if(datosDeChat.rows[0].username1 == data1.usuario ){     
                texto = datosDeChat.rows[0].message2
                if(typeof data1.texto == "object"){
                    texto += `{"usuario": "${data1.usuario}", "texto": ${JSON.stringify(data1.texto)},"fecha":"${fecha.getHours()}"};!`
                }
                else{
                    texto += `{"usuario": "${data1.usuario}", "texto": "${data1.texto}","fecha":"${fecha.getHours()}"};!`
                }
               

                await pool.query(`UPDATE contactos SET change2 = '1' , message2 = '${texto}' WHERE 
                                  username1 = '${data1.usuario}'  AND username2 = '${data1.usuario2}'`)
            }
            else{
                texto = datosDeChat.rows[0].message1
                if(typeof data1.texto == "object"){
                    texto += `{"usuario": "${data1.usuario}", "texto": ${JSON.stringify(data1.texto)},"fecha":"${fecha.getHours()}"};!`
                }
                else{
                    texto += `{"usuario": "${data1.usuario}", "texto": "${data1.texto}","fecha":"${fecha.getHours()}"};!`
                }
                
                await pool.query(`UPDATE contactos SET change1 = '1' , message1 = '${texto}' WHERE 
                                  username1 = '${data1.usuario2}' AND username2 = '${data1.usuario}'`)
                
            }
        }
        else{

            clientes[data1.usuario2].sockets.emit('enviar:user', {data1})
        }
            
    })

    socket.on("disconnect", (reason) => {  
         console.log(`disconnect ${socket.id} due to ${reason}`); 

         let usuarios = Object.keys(clientes)

         for(let i=0; i< usuarios.length; i++){

            let usuario = usuarios[i];

            if(socket.id == clientes[usuario].id){

                delete clientes[usuario];
            }
          }
    })
    
    const id = socket.id;
    clientes[session.datos.username] = {

                        id:id,
                        sockets:socket
                    };   
})



app.get('/',(req,res)=>{
    let datos = 'mensaje predeterminado';
    res.render('home',{'datos': datos})
})



app.get('/chat',async (req,res,next)=>{


    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/')

}, async (req,res)=>{
  
    req.session.usuario = usuarioPrincipal.username;
    req.session.contraseña = usuarioPrincipal.password;
    
    const encontrarContactos = await pool.query(`SELECT * FROM contactos WHERE username1 = '${session.datos.username}'
                                         or username2 = '${session.datos.username}'`);

   
    res.render('chat',{
                        'user':session.datos.username,
                        'contacto':false,
                        'contactos':encontrarContactos.rows 
                      })
    
})

app.get('/newcontact/:user', async (req,res)=>{
    const {user} = req.params

    session.datos = {
        username :user,
    }
    res.render('chat',{'user': user,'contacto':true,'contactos': 0})
})

app.post('/newcontact/:user',async (req,res)=>{
    const contact = req.body.newuser
    const {user} = req.params
    let coverchat ;

    const contacto = await pool.query(`SELECT * FROM usuarios WHERE username = '${contact}'`)
    coverchat =`${user}${contacto.rows[0].username}`;

    await pool.query(`INSERT INTO contactos (username1, username2,idChat,change1,change2,message1,message2) values
                    ('${user}','${contacto.rows[0].username}','${coverchat}','0','0',' ',' ')`)
    
    res.redirect('/chat')
})

app.post('/signin',async (req,res) =>{

    const {nombre,usuario,correo,contraseña} = req.body;
    
    session.datos = {
        username :usuario,
        fullname : nombre
    }
    
    await pool.query(`insert into usuarios (username,password,email,fullname) values('${usuario}','${contraseña}','${correo}','${nombre}')`)

    res.render('chat',{'user': usuario,'contacto': false,'contactos':[]})
})


app.post('/login',passport.authenticate('local',{
    successRedirect:'/chat',
    failureRedirect:'/'
}))


//estos dos metodos son los encargador de prosesar los fetch para encontrar el contenido y mostrarlo en pantalla


app.post('/encontrar',async (req,res)=>{

    let datosDeChat = await encontrarDatosDedb(req.body.usuarioPri,req.body.usuario);  
    let id = {"idchat":datosDeChat.rows[0].idchat}
    
    return res.send(id)
})

app.post('/enviar',async(req,res)=>{
    
    let datosDeChat = await encontrarDatosDedb(req.body.usuarioPri,req.body.usuario);
    let id = {"idchat":datosDeChat.rows[0].idchat,
              "texto":req.body.texto,
              }

    return res.send(id)
})


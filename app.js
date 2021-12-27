
const path = require('path')
const soketIO =require("socket.io");
const passport = require('passport');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const pool  = require('./database/db');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { createPoolCluster } = require('mysql');
const passportLocal = require('passport-local').Strategy
const fs = require('fs');
const os = require('os')

const clientes = {};
let rutaRaiz = os.homedir();
let usuarioPrincipal ;
// coneccion archivo base de datos 

const app = express();

//2) urlencoded es para capturar los datos del formulario y asi evitar errores

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
    const usuarios = await pool.query('SELECT * FROM usuarios WHERE username = ?' , [username])

    session.datos = {
        username :usuarios[0].username,
        fullname : usuarios[0].fullname
    }

    usuarioPrincipal = usuarios
    if(usuarios[0].password == password)
    {
       return  done(null,usuarios[0])
    }

    done(null,false)
    
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
app.use('/resources', express.static('public'))
app.use('/resources', express.static(__dirname + '/public'))

//5) - Establecer el motor de plantillas
app.set('view engine', 'ejs');

//6) - configurar express-session



// 7) ivocar modulo de coneccion base de datos

const server = app.listen(3000, (req,res)=>{
    
})

const io = soketIO(server);
let clients = io.sockets.client;

io.on('connection',(socket)=>{
    const id = socket.id;
    clientes[session.datos.username] = {

                        id:id,
                        sockets:socket
                    };

    

    socket.on('sala', (data) => {
        
        if(clientes[data.user] == undefined){
            console.log("usuario no conectado ")
            // cuando el usuario no esta conectado simplemente debe  guardar los datos en la base de datos 
            //ademas de esto  planear un escuchador que apenas ingrese verifique los datos 
        }
        else{
            //aqui meterlos a la misma "sala"
            // cliente que envia los datos 

            // no encuentras los datos por que la session se actualiza y no permite encontrar el dato por medio de este
            //usar la base de datos para encontar el archivo preferiblemente
            socket.on('enviar', (data1)=>{
                //recivir y organizar esos datos 
                //mandarlos al otro cliente
                console.log(data1)
    
                clientes[data1.usuario2].sockets.emit('enviar:user', {data1})
            })
            
            //este socket entra al usuario1
            

            //emitir un evento para el USUARIO  para actualizar sus datos
            //pero no los va a mostar a exepcio de el chat que se encuente abierto por lo cual apenas lleguen estos datos
            //hara un render en la pantalla paralela 
        }
        // verificar si el usuario se encuentra activo 
        // si se encuenta activo     unirlo a la sala  y hacer el renderisado de datos
        // si no guardar los mennsajes en la base de datos  
        //console.log("datos de sala" + data)
    })
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

},async (req,res) =>{
    req.session.usuario = usuarioPrincipal[0].username;
    req.session.contraseña = usuarioPrincipal[0].password;

    

    const contactos = await pool.query('SELECT * FROM contactos WHERE username1 = ? OR username2 = ?', 
                                        [session.datos.username,session.datos.username])

    res.render('chat',{'username': session.datos.fullname,
                        'user':session.datos.username,
                        'contacto':false,
                        'contactos':contactos
                      })
})

app.get('/newcontact', async (req,res)=>{
    res.render('chat',{'username': session.datos.fullname,'user': session.datos.username,'contacto':true,'contactos': 0})
})

app.post('/newcontact',async (req,res)=>{
    const contact = req.body.newuser
    let coverchat ;

    const contacto = await pool.query('SELECT * FROM usuarios WHERE username = ?',[contact])
    
    fs.mkdirSync(`${rutaRaiz}/chatAll/`,{recursive:true});

    fs.writeFileSync(`${rutaRaiz}/chatAll/chat${session.datos.username}${contacto[0].username}.json`,'{"principal" :[]}')

    coverchat =`${session.datos.username}${contacto[0].username}`;

    await pool.query(`INSERT INTO contactos (username1, username2,idChat,change1,change2,message1,message2) values
                    (?,?,?,?,?,?,?)`,[session.datos.username,contacto[0].username,coverchat,0,0,'r','r'])
    
    res.redirect('/chat')
})

app.post('/signin',async (req,res) =>{

    const {nombre,usuario,correo,contraseña} = req.body;

    const datos ={
        username:usuario,
        password:contraseña,
        email :correo,
        fullname:nombre
    }
    
    await pool.query('INSERT INTO usuarios set ?',[datos])
    
    res.render('chat',{'username': datos.username,'contacto': false})
})


app.post('/login',passport.authenticate('local',{
    successRedirect:'/chat',
    failureRedirect:'/'
}))

app.post('/encontrar',async (req,res)=>{

    let nomChat;

    nomChat = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                [req.body.usuarioPri,req.body.usuario])

    if(nomChat.length == 0){
        nomChat = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                [req.body.usuario,req.body.usuarioPri]);
    }
     
    let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat[0].idChat}.json`, 'UTF-8')    

    const json1 = JSON.parse(file);
    
    return res.send(json1)
})

app.post('/enviar',async(req,res)=>{

    let nomChat;
    // desorden muy grande revisar el metodo enviar para cambiarl la forma en la que llega la info
    // es necesario crear la ruta del archivo para que pueda acceder de manera correcta
    // y si manda los datos pero no los renderiza 

   /* let contactos = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                        [req.body.usuarioPri,req.body.usuario])


    if(contactos[0].username1 == undefined){
         contactos = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                        [req.body.usuario, req.body.usuarioPri])
    }


    if(contactos[0].username1 == req.body.usuarioPri )
    {  
        await pool.query('UPDATE contactos SET change2 = ? , message2 = ? WHERE username1 = ? AND username2 = ? ',
                        [1,req.body.texto,req.body.usuarioPri, req.body.usuario])
    }
    else
    {
        await pool.query('UPDATE contactos SET change2 = ? , message2 = ? WHERE username1 = ? AND username2 = ? ',
                        [1,req.body.texto,req.body.usuario , req.body.usuarioPri])
    }*/
    nomChat = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                [req.body.usuarioPri,req.body.usuario])

    if(nomChat.length == 0){
        nomChat = await pool.query('SELECT * FROM contactos WHERE username1 = ? and username2 = ?', 
                                [req.body.usuario,req.body.usuarioPri]);
    }
     

    console.log(nomChat)
    
    let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat[0].idChat}.json`, 'UTF-8')
    
    const json = JSON.parse(file);
    json.principal.push({'usuario': req.body.usuarioPri, 'texto': req.body.texto,'fecha':'3:00','direccion':'1'});

    file = fs.writeFileSync(`${rutaRaiz}/chatAll/chat${req.body.usuarioPri}${req.body.usuario}.json`, JSON.stringify(json));
    
    return res.send({'usuario': req.body.usuarioPri, 'texto': req.body.texto,'fecha':'3:00','direccion':'1'})
})


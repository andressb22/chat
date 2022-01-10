
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
    
    const usuarios = await pool.query(`SELECT * FROM usuarios WHERE username = '${username}'` )
    
    
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


const server = app.listen(process.env.PORT || 3000, (req,res)=>{})

const io = soketIO(server);

io.on('connection',async (socket)=>{

    socket.on('datos:server',async(data)=>{
           
            // verificar por que carga un undefined si el change ya esta en 0 ;

           
            
            for(let i = 0; i < data.amigos.length; i++){
                 
                let nomChat;

                nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data.user}' and 
                                            username2 = '${data.amigos[i]}'`)
                
                if(nomChat.rows.length == 0){

                    nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data.amigos[i]}' and 
                                               username2 = '${data.user}'`);

                    let data1 = JSON.stringify(nomChat.rows[0].change2);
                    data1 = parseInt(data1)

                    if(data1 == 1){

                        let message = JSON.parse(JSON.stringify(nomChat.rows[0].message2))
                        let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idChat}.json`, 'UTF-8')
    
                        const json = JSON.parse(file);
                        json.principal.push(message);

                        file = fs.writeFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idChat}.json`, JSON.stringify(json));

                        await pool.query(`UPDATE contactos SET change2 = '${0}' , message2 = ' ' WHERE
                                         username1 = '${data.amigos[i]}' AND username2 = '${data.user}'`)
                     }
                     
                }else{

                    let data1 = JSON.stringify(nomChat.rows[0].change1);
                    data1 = parseInt(data1)

                    if(data1 == 1){

                        let message = JSON.parse(JSON.stringify(nomChat.rows[0].message2))
                        let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idChat}.json`, 'UTF-8')
    
                        const json = JSON.parse(file);
                        json.principal.push(message);

                        file = fs.writeFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idChat}.json`, JSON.stringify(json));

                        await pool.query(`UPDATE contactos SET change1 = '${0}' , message1 = ' ' WHERE 
                                        username1 = '${data.user}' AND username2 = '${data.amigos[i]}'`)
                        console.log(message);
                     }
                }
                                                   
            }
            
            // verifico si hay mensaje nuevos 
            // y  actualizo en el json de  mi computadora 
            // por ultimo actualizar la barra lateral 
    })

    socket.on('guardar', async (data)=>{
      
        let nomChat;
        nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data.usuario}' and 
                                    username2 = '${data.usuario2}'`)

        if(nomChat.rows.length == 0){
            nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data.usuario2}' and 
                                        username2 = '${data.usuario}'`);
        }

        let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idchat}.json`, 'UTF-8')
    
        const json = JSON.parse(file);
        json.principal.push({'usuario': data.usuario, 'texto': data.texto,'fecha':'3:00','direccion':data.direccion});
        
        file = fs.writeFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idchat}.json`, JSON.stringify(json));
    })

    socket.on('enviar', async (data1)=>{          

        let texto;
        console.log(data1)

        if(clientes[data1.usuario2] == undefined){
            console.log("usuario no conectado ")

            let contactos = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data1.usuario}' and 
                                              username2 = '${data1.usuario2}'`)
                                              
            if(contactos.rows.length == 0){
                contactos = await pool.query(`SELECT * FROM contactos WHERE username1 = '${data1.usuario2}' and 
                                              username2 = '${data1.usuario}'`)
            }
           
            if(contactos.rows[0].username1 == data1.usuario ){  
            
                texto = contactos.rows[0].message2
                texto += `{"usuario": ${data1.usuario2}, "texto": ${data1.texto},"fecha":"3:00","direccion":1}`

                await pool.query(`UPDATE contactos SET change2 = '1' , message2 = '${texto}' WHERE 
                                  username1 = '${data1.usuario}'  AND username2 = '${data1.usuario2}'`)
            }
            else{
                
                texto = contactos.rows[0].message1
                texto += `{"usuario": ${data1.usuario2}, "texto": ${data1.texto},"fecha":"3:00","direccion":1}`
                await pool.query(`UPDATE contactos SET change1 = '1' , message1 = '${texto}' WHERE 
                                  username1 = '${data1.usuario}' AND username2 = '${data1.usuario2}'`)
                
            }
                            // cuando el usuario no esta conectado simplemente debe  guardar los datos en la base de datos 
                            //ademas de esto  planear un escuchador que apenas ingrese verifique los datos 
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
    
    const contactos = await pool.query(`SELECT * FROM contactos WHERE username1 = '${session.datos.username}'
                                         or username2 = '${session.datos.username}'`);

   
    res.render('chat',{
                        'username': session.datos.fullname,
                        'user':session.datos.username,
                        'contacto':false,
                        'contactos':contactos.rows,
                        'ruta': os.homedir
                      })
    
})

app.get('/newcontact', async (req,res)=>{
    res.render('chat',{'username': session.datos.fullname,'user': session.datos.username,'contacto':true,'contactos': 0})
})

app.post('/newcontact',async (req,res)=>{
    const contact = req.body.newuser
    let coverchat ;

    const contacto = await pool.query(`SELECT * FROM usuarios WHERE username = '${contact}'`)
  
    fs.mkdirSync(`${rutaRaiz}/chatAll/`,{recursive:true});

    fs.writeFileSync(`${rutaRaiz}/chatAll/chat${session.datos.username}${contacto.rows[0].username}.json`,'{"principal" :[]}')

    coverchat =`${session.datos.username}${contacto.rows[0].username}`;
    // arreglar esto hoyy
    await pool.query(`INSERT INTO contactos (username1, username2,idChat,change1,change2,message1,message2) values
                    ('${session.datos.username}','${contacto.rows[0].username}','${coverchat}','0','0',' ',' ')`)
    
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
    
    await pool.query(`insert into usuarios (username,password,email,fullname) values('${usuario}','${contraseña}','${correo}','${nombre}')`)
    
    res.render('chat',{'user': datos.username,'contacto': false})
})


app.post('/login',passport.authenticate('local',{
    successRedirect:'/chat',
    failureRedirect:'/'
}))

app.post('/encontrar',async (req,res)=>{

    let nomChat;
    let file;
    rutaRaiz = os.homedir();

    nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${req.body.usuarioPri}' and
                                 username2 = '${req.body.usuario}'`)

    if(nomChat.rows.length == 0){
        nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${req.body.usuario}' and
                                    username2 = '${req.body.usuarioPri}'`);
    }
     
    try{
         file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idchat}.json`, 'UTF-8')  
    }catch(e){
        console.log("entra en error")
        fs.mkdirSync(`${rutaRaiz}/chatAll/`,{recursive:true});
        fs.writeFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idchat}.json`,'{"principal" :[]}')
        file = '{"principal" :[]}';
    }
    
    // si archivo no existe debe crearlo pero si los datos estan en el otro computador deberia traerlos    
    

    const json1 = JSON.parse(file);
    
    return res.send(json1)
})

app.post('/enviar',async(req,res)=>{

    let nomChat;
    let direccion = "1";
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
    nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${req.body.usuarioPri}' and
                               username2 = '${req.body.usuario}'`)

    if(nomChat.rows.length == 0){
        nomChat = await pool.query(`SELECT * FROM contactos WHERE username1 = '${req.body.usuario}' and 
                                   username2 = '${req.body.usuarioPri}'`);
    }

    if(req.body.direccion == 1){
         direccion = "0";
    }

    let file = fs.readFileSync(`${rutaRaiz}/chatAll/chat${nomChat.rows[0].idChat}.json`, 'UTF-8')
    console.log(file);
    const json = JSON.parse(file);
    json.principal.push({'usuario': req.body.usuarioPri, 'texto': req.body.texto,'fecha':'3:00','direccion':direccion});

    file = fs.writeFileSync(`${rutaRaiz}/chatAll/chat${req.body.usuarioPri}${req.body.usuario}.json`, JSON.stringify(json));
    
    return res.send({'usuario': req.body.usuarioPri, 'texto': req.body.texto,'fecha':'3:00','direccion':'1'})
})


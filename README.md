# chat
chat simple creado con javascript y nodejs



el repositorio no tiene el archivo de conexion a la base de datos subido por lo tanto si se desea utilizar el repositorio se debe usar la estructura de la base de datos o cambiarla.

la estructura es la siguiente:

table usuarios(
  id integer primary key,
  username varchar(70) unique,
  password varchar(70) not null,
  email varchar(90) not null,
  fullname varchar(100) not null
)

table contactos(
  id integer primary key,
  username1 varchar(70),
  username2 varchar(70),
  idchat varchar(140) not null,
  change1 bit,
  change2 bit,
  message1 varchar(9900000),
  message2 varchar(9900000)
)

const {Client} = require('pg');

const pool = new Client({
    user:'osymhlsoanyfxl',
    host:'ec2-54-80-70-66.compute-1.amazonaws.com',
    database:'d2j39v6dqj9r0g',
    password:'917aee8c9aa24d724025e6ca49471eebe6e5ada685ab6228bc34dffa440bc036',
    port: '5432',
    ssl:{
        rejectUnauthorized:false,
    }
});

const activatedb = async ()=>{
    await pool.connect();
}
activatedb();

module.exports = pool;

/*const mysql = require("mysql")
const {promisify} = require('util');
const database = {
    host:'localhost',
    user:'root',
    pasword:'pasword12',
    database:'chatall'
    host:'ec2-54-80-70-66.compute-1.amazonaws.com',
    port: '5432',
    user:'osymhlsoanyfxl',
    pasword:'917aee8c9aa24d724025e6ca49471eebe6e5ada685ab6228bc34dffa440bc036',
    database:'d2j39v6dqj9r0g'
    

}
const pool = mysql.createPool(database); // pasa el objeto con los datos de la base de datos

pool.getConnection((err,connection) =>{
    if(err){
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.error('data base conection was closed')
        }
        if(err.code === 'ER_CON_COUNT_ERROR'){
            console.error('data base has to many conection')
        }
        if(err.code === 'ECONNREFUSED'){
            console.error('data base connection was refused')
        }
    }
    if(connection) connection.release()
    console.log('db is connected');
    return;
});

pool.query = promisify(pool.query);*/


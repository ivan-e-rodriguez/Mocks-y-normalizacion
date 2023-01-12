const express = require('express')
const handlebars = require('express-handlebars')
const { Server: HttpServer } = require('http')
const { default: knex } = require('knex')
const { Server: IOServer } = require('socket.io')
const { faker } = require('@faker-js/faker')



const app = express()
const httpServer = HttpServer(app)
const io = new IOServer(httpServer)


app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('./public'))

//------------------------------------------------HANDLEBARS---------------------------------------------------------------------------

app.engine('handlebars', handlebars.engine())

app.set('views', './public/views')
app.set('view engine', 'handlebars')


const { options } = require('./options/mysqlconn.js')
const { options2 } = require('./options/sqlite3.js')
const { ContenedorSQL } = require('./sqlContainer.js')
const { ContenedorSQLite } = require('./sqliteContainer.js')


const sql = new ContenedorSQL(options)

const sqlite = new ContenedorSQLite(options2)

//--------------------------------------------MENSAJES NORMALIZADOS-------------------------------------------------------------------------------

const fs = require('fs');



const { normalize, schema } = require('normalizr')

const schemaAutor = new schema.Entity('autor', {}, { idAttribute: 'email' })

const schemaMensaje = new schema.Entity('mensaje', { autor: schemaAutor }, { idAttribute: 'id' })

const schemaMensajes = new schema.Entity('mensajes', { mensajes: [schemaMensaje] }, { idAttribute: 'id' })

const normalizarMensajes = (mensajesId) => normalize(mensajesId, schemaMensajes)


io.on('connection', socket => {

  socket.emit('mensajes', mensajesNormalizados())

  socket.on('mensaje', () => {
    io.sockets.emit('mensajes', mensajesNormalizados())
  })
})

function mensajesNormalizados() {
  const archivo = fs.readFileSync('./db/mensajes.json');
  const mensajes = JSON.parse(archivo)
  const normalizados = normalizarMensajes({ id: 'mensajes', mensajes })
  return normalizados
}




//-------------------------------------------PRODUCTOS -----------------------------------------------------------------------------------

sql.crearTabla()
  .then(() => {
    const productos = [
      {
        "title": "Escuadra",
        "price": 123.45,
        "thumbnail": "https://cdn3.iconfinder.com/data/icons/education-209/64/ruler-triangle-stationary-school-256.png",

      },
      {
        "title": "Calculadora",
        "price": 234.56,
        "thumbnail": "https://cdn3.iconfinder.com/data/icons/education-209/64/calculator-math-tool-school-256.png",

      },
      {
        "title": "Globo Terráqueo",
        "price": 345.67,
        "thumbnail": "https://cdn3.iconfinder.com/data/icons/education-209/64/globe-earth-geograhy-planet-school-256.png",

      }
    ]

    return sql.insertarProductos(productos)
  })
  .then(() => {
    return sql.listarProductos()
  })
  .then((productos) => {
    app.get('/productos', (req, res) => {
      let listaProductos = false;

      if (productos.length > 0) {
        listaProductos = true
      }

      res.render('./partials/productos', { listaProductos: listaProductos, productos: productos })
    })
  })
  .finally(() => {
    sql.close();
  })





//-------------------------------------------------ROUTER PRODUCTOS-------------------------------------------------------------------

//-----------------------------------------------PRODUCOTS FAKER.JS------------------------------------------------------------------
app.get('/productos-test', (req, res) => {
  let listaProductos2 = []
  function productos() {
    for (let i = 0; i < 5; i++) {
      const producto = {
        nombre: faker.commerce.product(),
        precio: faker.commerce.price(),
        imagen: faker.image.imageUrl()
      }
      listaProductos2.push(producto)
    }
  }
  productos()
  res.render('./partials/productos', { productos: listaProductos2 })
})


app.post('/productos', (req, res) => {

  sql.insertarProductos(req.body)
  res.redirect('/productos')
})


//------------------------------------------------CONEXION--------------------------------------------------------------------------

const PORT = 8080

httpServer.listen(PORT, () => {
  console.log("Escuchando en 8080");
})
const knex = require('knex')


class ContenedorSQLite{
    constructor(options) {
        this.knex = knex(options)
    }

    crearTabla(){
        return this.knex.schema.dropTableIfExists('mensajes')
        .finally(()=> {
            return this.knex.schema.createTable('mensajes', table => {
                table.string('date')
                table.string('email').notNullable()
                table.float('mensaje').notNullable()

            })
        })
    }

    insertarMensajes(mensajes) {
        return this.knex('mensajes').insert(mensajes)
    }

    listarMensajes() {
        return this.knex('mensajes').select('*')
    }

    close() {
        this.knex.destroy()
    }
}

module.exports = {
    ContenedorSQLite
}
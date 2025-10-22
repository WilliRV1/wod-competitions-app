exports.getUser = (req,res) => {
    res.json({message: "USUARIO"})


}

exports.newUser = (req,res) => {

    res.json({ message: "Registro de usuario" })
}


exports.getUserID = (req,res) => {
    res.json({ message: " =usuario con id" })


}

exports.putUser = (req,res) => {
    res.json({ message: "Actualizando usuario" })


}


exports.deleteUser = (req,res) => {
    res.json({ message: "Borrando usuario" })


}
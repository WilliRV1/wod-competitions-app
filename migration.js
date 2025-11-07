// migration.js
// Script para migrar usuarios existentes al nuevo modelo simplificado
// EJECUTAR UNA SOLA VEZ

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/Models/user.model.js');
const Box = require('./src/Models/box.model.js');

async function migrateDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        console.log('\n🔄 Iniciando migración...\n');

        // ===== 1. MIGRAR USUARIOS =====
        console.log('👤 Migrando usuarios...');
        
        const usersToMigrate = await User.find({});
        console.log(`   Encontrados: ${usersToMigrate.length} usuarios`);

        let usersUpdated = 0;
        let usersWithIssues = 0;

        for (const user of usersToMigrate) {
            try {
                // Eliminar campo 'rol' si existe
                if (user.rol !== undefined) {
                    user.rol = undefined;
                }

                // Establecer valores por defecto para nuevos campos
                user.profileCompleted = true; // Usuarios existentes se consideran completos
                user.onboardingStep = 3; // Han completado todo
                user.lastActive = user.updatedAt || new Date();

                // Asegurar que apellidos exista
                if (!user.apellidos) {
                    user.apellidos = '';
                }

                // Inicializar array de boxes si no existe
                if (!user.boxesPropietarios) {
                    user.boxesPropietarios = [];
                }

                await user.save();
                usersUpdated++;
                
                console.log(`   ✓ Usuario migrado: ${user.nombre} ${user.apellidos}`);

            } catch (error) {
                console.error(`   ✗ Error con usuario ${user.email}:`, error.message);
                usersWithIssues++;
            }
        }

        console.log(`\n   Resumen Usuarios:`);
        console.log(`   - Migrados: ${usersUpdated}`);
        console.log(`   - Con problemas: ${usersWithIssues}`);

        // ===== 2. ACTUALIZAR RELACIÓN BOXES =====
        console.log('\n🏋️ Actualizando relación de boxes...');
        
        const boxes = await Box.find({}).populate('owner');
        console.log(`   Encontrados: ${boxes.length} boxes`);

        let boxesUpdated = 0;

        for (const box of boxes) {
            try {
                if (box.owner && box.owner._id) {
                    const user = await User.findById(box.owner._id);
                    
                    if (user) {
                        // Agregar box a la lista del usuario si no está
                        if (!user.boxesPropietarios.includes(box._id)) {
                            user.boxesPropietarios.push(box._id);
                            await user.save();
                            boxesUpdated++;
                            console.log(`   ✓ Box "${box.nombre}" vinculado a ${user.nombre}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`   ✗ Error con box ${box.nombre}:`, error.message);
            }
        }

        console.log(`\n   Boxes actualizados: ${boxesUpdated}`);

        // ===== 3. VERIFICACIÓN FINAL =====
        console.log('\n🔍 Verificación final...');
        
        const finalCheck = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    conPerfilCompleto: {
                        $sum: { $cond: ['$profileCompleted', 1, 0] }
                    },
                    conApellidos: {
                        $sum: { $cond: [{ $ne: ['$apellidos', ''] }, 1, 0] }
                    },
                    conNivel: {
                        $sum: { $cond: [{ $ne: ['$nivel', null] }, 1, 0] }
                    }
                }
            }
        ]);

        if (finalCheck.length > 0) {
            const stats = finalCheck[0];
            console.log('\n📊 Estadísticas finales:');
            console.log(`   - Total usuarios: ${stats.total}`);
            console.log(`   - Con perfil completo: ${stats.conPerfilCompleto}`);
            console.log(`   - Con apellidos: ${stats.conApellidos}`);
            console.log(`   - Con nivel: ${stats.conNivel}`);
        }

        console.log('\n✅ Migración completada exitosamente\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        throw error;
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada\n');
    }
}

// Ejecutar migración
console.log('╔═══════════════════════════════════════════════╗');
console.log('║   MIGRACIÓN A REGISTRO SIMPLIFICADO           ║');
console.log('║   WOD APP - CrossFit Community                ║');
console.log('╚═══════════════════════════════════════════════╝\n');

console.log('⚠️  ADVERTENCIA:');
console.log('   - Este script modificará la base de datos');
console.log('   - Ejecutar solo UNA VEZ');
console.log('   - Asegúrate de tener backup\n');

// Esperar confirmación (comentar para ejecutar automáticamente)
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('¿Continuar con la migración? (si/no): ', (answer) => {
    readline.close();
    
    if (answer.toLowerCase() === 'si' || answer.toLowerCase() === 's') {
        migrateDatabase()
            .then(() => {
                console.log('🎉 Proceso completado');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Migración falló:', error);
                process.exit(1);
            });
    } else {
        console.log('❌ Migración cancelada');
        process.exit(0);
    }
});

// Para ejecutar sin confirmación (producción):
// Comentar el bloque readline y descomentar:
migrateDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
// Script de migración para simplificar el modelo
// Ejecutar desde la raíz del proyecto: node migrate-to-simplified.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: No se encontró MONGODB_URI en el archivo .env');
    process.exit(1);
}

// Modelos temporales para la migración (sin validaciones estrictas)
const UserSchema = new mongoose.Schema({}, { strict: false });
const CompetitionSchema = new mongoose.Schema({}, { strict: false });
const BoxSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Competition = mongoose.model('Competition', CompetitionSchema);
const Box = mongoose.model('Box', BoxSchema);

async function migrate() {
    try {
        console.log('🚀 Iniciando migración...');
        console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Ocultar credenciales
        
        console.log('\n🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // ========================================
        // PASO 1: Migrar Usuarios
        // ========================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 PASO 1: Migrando usuarios...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const users = await User.find({});
        console.log(`   🔍 Encontrados ${users.length} usuarios\n`);
        
        let usersUpdated = 0;
        let usersSkipped = 0;
        
        for (const user of users) {
            const updates = {};
            const unset = {};
            
            // Convertir rol a campos nuevos
            if (user.rol) {
                if (user.rol === 'dueño_box') {
                    updates.esBoxVerificado = false;
                    if (user.box) {
                        updates.boxPropietario = user.box;
                        console.log(`   📦 Usuario ${user.email} era dueño_box, guardando referencia a box`);
                    }
                } else if (user.rol === 'atleta' && user.box) {
                    // Para atletas, intentar convertir ObjectId a nombre del box
                    try {
                        const box = await Box.findById(user.box);
                        if (box) {
                            updates.boxAfiliado = box.nombre;
                            console.log(`   🏋️ Usuario ${user.email} entrena en: ${box.nombre}`);
                        }
                    } catch (error) {
                        console.warn(`   ⚠️  No se pudo convertir box para usuario ${user.email}`);
                    }
                }
                unset.rol = 1; // Eliminar campo rol
            }
            
            // Asegurar que tenga nivel
            if (!user.nivel) {
                updates.nivel = 'Novato';
                console.log(`   ℹ️  Usuario ${user.email} sin nivel, asignando 'Novato'`);
            }
            
            // Aplicar updates si hay cambios
            if (Object.keys(updates).length > 0 || Object.keys(unset).length > 0) {
                const updateQuery = {};
                if (Object.keys(updates).length > 0) updateQuery.$set = updates;
                if (Object.keys(unset).length > 0) updateQuery.$unset = unset;
                
                await User.updateOne({ _id: user._id }, updateQuery);
                usersUpdated++;
            } else {
                usersSkipped++;
            }
        }
        
        console.log(`\n   ✅ ${usersUpdated} usuarios actualizados`);
        console.log(`   ⏭️  ${usersSkipped} usuarios sin cambios`);

        // ========================================
        // PASO 2: Migrar Competencias
        // ========================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 PASO 2: Migrando competencias...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const competitions = await Competition.find({});
        console.log(`   🔍 Encontradas ${competitions.length} competencias\n`);
        
        let competitionsUpdated = 0;
        let competitionsSkipped = 0;
        let competitionsError = 0;
        
        for (const comp of competitions) {
            const updates = {};
            const unset = {};
            
            // Si tiene organizador (Box), convertirlo
            if (comp.organizador && !comp.creador) {
                try {
                    const box = await Box.findById(comp.organizador);
                    if (box && box.owner) {
                        updates.creador = box.owner;
                        updates.boxRepresentado = box.nombre;
                        updates.organizadorVerificado = comp.organizador;
                        unset.organizador = 1;
                        console.log(`   🏢 Competencia "${comp.nombre}" ahora creada por dueño de ${box.nombre}`);
                    } else {
                        console.warn(`   ⚠️  Box ${comp.organizador} no tiene owner para competencia "${comp.nombre}"`);
                        competitionsError++;
                        continue;
                    }
                } catch (error) {
                    console.error(`   ❌ Error al migrar organizador para "${comp.nombre}":`, error.message);
                    competitionsError++;
                    continue;
                }
            }
            
            // Si ya tiene creador, solo eliminar organizador si existe
            if (comp.creador && comp.organizador) {
                unset.organizador = 1;
                console.log(`   ℹ️  Competencia "${comp.nombre}" ya tiene creador, eliminando campo organizador`);
            }
            
            // Aplicar updates
            if (Object.keys(updates).length > 0 || Object.keys(unset).length > 0) {
                const updateQuery = {};
                if (Object.keys(updates).length > 0) updateQuery.$set = updates;
                if (Object.keys(unset).length > 0) updateQuery.$unset = unset;
                
                await Competition.updateOne({ _id: comp._id }, updateQuery);
                competitionsUpdated++;
            } else {
                competitionsSkipped++;
            }
        }
        
        console.log(`\n   ✅ ${competitionsUpdated} competencias actualizadas`);
        console.log(`   ⏭️  ${competitionsSkipped} competencias sin cambios`);
        if (competitionsError > 0) {
            console.log(`   ⚠️  ${competitionsError} competencias con errores (revisa logs arriba)`);
        }

        // ========================================
        // PASO 3: Verificar Integridad
        // ========================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 PASO 3: Verificando integridad...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const totalUsers = await User.countDocuments({});
        const usersWithRol = await User.countDocuments({ rol: { $exists: true } });
        const totalComps = await Competition.countDocuments({});
        const compsWithoutCreator = await Competition.countDocuments({ creador: { $exists: false } });
        const compsWithOrganizador = await Competition.countDocuments({ organizador: { $exists: true } });
        
        console.log(`\n   👥 Usuarios:`);
        console.log(`      Total: ${totalUsers}`);
        console.log(`      ${usersWithRol === 0 ? '✅' : '⚠️ '} Con campo "rol" (viejo): ${usersWithRol}`);
        
        console.log(`\n   🏆 Competencias:`);
        console.log(`      Total: ${totalComps}`);
        console.log(`      ${compsWithoutCreator === 0 ? '✅' : '⚠️ '} Sin creador: ${compsWithoutCreator}`);
        console.log(`      ${compsWithOrganizador === 0 ? '✅' : '⚠️ '} Con campo "organizador" (viejo): ${compsWithOrganizador}`);
        
        if (compsWithoutCreator > 0) {
            console.log(`\n   ⚠️  ADVERTENCIA: Hay ${compsWithoutCreator} competencias sin creador.`);
            console.log(`      Deberás asignarlas manualmente o eliminarlas.`);
            
            // Mostrar detalles
            const orphanComps = await Competition.find({ creador: { $exists: false } }).limit(5);
            console.log(`\n      Primeras competencias sin creador:`);
            orphanComps.forEach(comp => {
                console.log(`      - "${comp.nombre}" (ID: ${comp._id})`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 ¡Migración completada exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n📝 Próximos pasos:');
        console.log('   1. ✅ Revisa los logs arriba para verificar todo está bien');
        console.log('   2. 📝 Actualiza los archivos del modelo (User, Competition)');
        console.log('   3. 🎮 Actualiza los controladores');
        console.log('   4. 🎨 Actualiza el frontend (LoginPage, CreateCompetition)');
        console.log('   5. 🚀 Reinicia el servidor y prueba todo\n');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO en la migración:', error);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB');
        process.exit(0);
    }
}

// Ejecutar migración con manejo de errores
migrate().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
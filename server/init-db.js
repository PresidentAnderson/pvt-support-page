// Database initialization script
require('dotenv').config();
const { sequelize } = require('./config/database');
const { Organization, SystemStatus } = require('./models');

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ Database models synchronized.');
    
    // Create default organizations
    const organizations = await Organization.bulkCreate([
      {
        code: 'pvt-main',
        name: 'PVT Hostel - Main Property',
        type: 'hostel',
        address: '4460 Christophe Colomb',
        city: 'Montreal',
        province: 'QC',
        postalCode: 'H2J 3G5',
        country: 'Canada',
        phone: '514-400-6369',
        email: 'hello@market.pvthostel.ca',
        primaryColor: '#005f73',
        secondaryColor: '#0a9396'
      },
      {
        code: 'pvt-east',
        name: 'PVT Hostel - East Location',
        type: 'hostel',
        city: 'Montreal',
        province: 'QC',
        country: 'Canada',
        primaryColor: '#005f73',
        secondaryColor: '#0a9396'
      },
      {
        code: 'pvt-west',
        name: 'PVT Hostel - West Location',
        type: 'hostel',
        city: 'Montreal',
        province: 'QC',
        country: 'Canada',
        primaryColor: '#005f73',
        secondaryColor: '#0a9396'
      },
      {
        code: 'studionyne',
        name: 'StudioNYNE',
        type: 'studio',
        city: 'Montreal',
        province: 'QC',
        country: 'Canada',
        primaryColor: '#ca6702',
        secondaryColor: '#ee9b00'
      },
      {
        code: 'king-legend',
        name: 'King Legend, Inc.',
        type: 'corporate',
        city: 'Montreal',
        province: 'QC',
        country: 'Canada',
        primaryColor: '#005f73',
        secondaryColor: '#0a9396'
      },
      {
        code: 'urban-stay',
        name: 'Urban Stay Hostels',
        type: 'hostel',
        city: 'Montreal',
        province: 'QC',
        country: 'Canada',
        primaryColor: '#0a9396',
        secondaryColor: '#ee9b00'
      }
    ]);
    
    console.log(`✅ Created ${organizations.length} organizations.`);
    
    // Create default system statuses
    const systemStatuses = await SystemStatus.bulkCreate([
      {
        serviceName: 'Booking Engine',
        status: 'operational',
        description: 'All booking systems functioning normally',
        uptime: 99.9
      },
      {
        serviceName: 'Payment Processing',
        status: 'operational',
        description: 'Payment gateway operational',
        uptime: 99.95
      },
      {
        serviceName: 'Channel Manager',
        status: 'operational',
        description: 'All channels syncing correctly',
        uptime: 99.8
      },
      {
        serviceName: 'Staff Portal',
        status: 'operational',
        description: 'Staff portal accessible',
        uptime: 99.99
      },
      {
        serviceName: 'Guest Portal',
        status: 'operational',
        description: 'Guest services available',
        uptime: 99.9
      },
      {
        serviceName: 'Reporting System',
        status: 'degraded',
        description: 'Performance issues - under maintenance',
        uptime: 95.5,
        incidentStart: new Date()
      }
    ]);
    
    console.log(`✅ Created ${systemStatuses.length} system status entries.`);
    
    console.log('\n🎉 Database initialization complete!');
    console.log('\nYou can now start the server with: npm start');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run initialization
initDatabase();
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.alertLog.deleteMany();
  await prisma.cronJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.alertSetting.deleteMany();
  await prisma.renewalHistory.deleteMany();
  await prisma.contractAdjustment.deleteMany();
  await prisma.contractFile.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.org.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log("👤 Creating users...");
  const owner = await prisma.user.create({
    data: {
      email: "davi.cintra2002@gmail.com",
      name: "Davi Cintra",
      emailVerified: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "davi.cintra2018@gmail.com",
      name: "Davi 02",
      emailVerified: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@contratei.com",
      name: "Carlos Oliveira",
      emailVerified: new Date(),
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: "viewer@contratei.com",
      name: "Ana Costa",
      emailVerified: new Date(),
    },
  });

  // Create test organization (Brazil)
  console.log("🏢 Creating organizations...");
  const orgBR = await prisma.org.create({
    data: {
      name: "Empresa Teste LTDA",
      slug: "empresa-teste-ltda",
      country: "BR",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      currency: "BRL",
      // PJ organization with address
      orgType: "PJ",
      legalName: "Empresa Teste LTDA",
      tradeName: "Empresa Teste",
      cnpj: "12.345.678/0001-90",
      ie: "123.456.789.012",
      addressCep: "01310100",
      addressStreet: "Avenida Paulista",
      addressNumber: "1578",
      addressComplement: "Sala 501",
      addressNeighborhood: "Bela Vista",
      addressCity: "São Paulo",
      addressState: "SP",
      members: {
        create: [
          {
            userId: owner.id,
            role: "OWNER",
          },
          {
            userId: admin.id,
            role: "ADMIN",
          },
          {
            userId: manager.id,
            role: "MANAGER",
          },
          {
            userId: viewer.id,
            role: "VIEWER",
          },
        ],
      },
    },
  });

  // Create second BR organization for Davi
  const orgBR2 = await prisma.org.create({
    data: {
      name: "Startup Inovadora SA",
      slug: "startup-inovadora-sa",
      country: "BR",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      currency: "BRL",
      // PF organization (individual contractor/freelancer)
      orgType: "PF",
      cpf: "123.456.789-00",
      addressCep: "04542000",
      addressStreet: "Avenida Brigadeiro Faria Lima",
      addressNumber: "3477",
      addressComplement: "Torre B, 15º andar",
      addressNeighborhood: "Itaim Bibi",
      addressCity: "São Paulo",
      addressState: "SP",
      members: {
        create: [
          {
            userId: owner.id,
            role: "ADMIN",
          },
        ],
      },
    },
  });

  // Create alert settings
  console.log("🔔 Creating alert settings...");
  await prisma.alertSetting.create({
    data: {
      orgId: orgBR.id,
      eventType: "CONTRACT_DUE_SOON",
      daysBeforeArray: [90, 60, 30],
      channels: ["EMAIL"],
      enabled: true,
    },
  });
  await prisma.alertSetting.create({
    data: {
      orgId: orgBR.id,
      eventType: "CONTRACT_EXPIRED",
      daysBeforeArray: [0],
      channels: ["EMAIL", "IN_APP"],
      enabled: true,
    },
  });

  // Create active contracts
  console.log("📄 Creating active contracts...");
  const contract1 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Contrato de Marketing Digital",
      contractType: "OUTBOUND",
      counterpartyName: "Agência Digital XYZ",
      counterpartyContact: "contato@agenciadigital.com",
      ownerUserId: owner.id,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-01-15"),
      nextRenewalDate: new Date("2025-01-15"),
      periodicityDays: 365,
      autoRenew: true,
      valueAmount: 50000.0,
      currency: "BRL",
      status: "ACTIVE",
      adjustmentType: "FIXED_PERCENT",
      adjustmentValue: 5.0,
      costCenter: "Marketing",
      tags: ["marketing", "essencial", "digital"],
      notes:
        "Contrato de serviços de marketing digital e gestão de redes sociais.",
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Licença Microsoft 365",
      counterpartyName: "Microsoft Corporation",
      counterpartyContact: "suporte@microsoft.com.br",
      ownerUserId: admin.id,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-03-01"),
      nextRenewalDate: new Date("2025-03-01"),
      periodicityDays: 365,
      autoRenew: true,
      valueAmount: 35000.0,
      currency: "BRL",
      status: "ACTIVE",
      adjustmentType: "NONE",
      costCenter: "TI",
      tags: ["software", "cloud", "essencial"],
      notes: "Licenças para 50 usuários.",
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Hospedagem AWS",
      counterpartyName: "Amazon Web Services",
      counterpartyContact: "aws-suporte@amazon.com",
      ownerUserId: manager.id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-07-01"),
      nextRenewalDate: new Date("2024-07-01"),
      periodicityDays: 30,
      autoRenew: true,
      valueAmount: 3500.0,
      currency: "BRL",
      status: "ACTIVE",
      adjustmentType: "FIXED_PERCENT",
      adjustmentValue: 3.0,
      costCenter: "TI",
      tags: ["cloud", "infraestrutura", "essencial"],
      notes: "Serviços de hospedagem e banco de dados.",
    },
  });

  // Create contract expiring soon (DUE_SOON)
  console.log("⚠️ Creating contracts expiring soon...");
  const contract4 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Contrato de Limpeza",
      counterpartyName: "Limpeza Total LTDA",
      counterpartyContact: "contato@limpezatotal.com.br",
      ownerUserId: admin.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // +45 days
      nextRenewalDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      periodicityDays: 45,
      autoRenew: false,
      valueAmount: 12000.0,
      currency: "BRL",
      status: "DUE_SOON",
      adjustmentType: "FIXED_PERCENT",
      adjustmentValue: 5.0, // 5% annual adjustment
      costCenter: "Operações",
      tags: ["limpeza", "facilities"],
      notes: "Contrato de serviços de limpeza do escritório.",
    },
  });

  // Create expired contract
  console.log("❌ Creating expired contract...");
  const contract5 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Seguro Empresarial",
      counterpartyName: "Seguradora ABC",
      counterpartyContact: "seguros@seguradoraabc.com.br",
      ownerUserId: owner.id,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2024-01-01"),
      periodicityDays: 365,
      autoRenew: false,
      valueAmount: 25000.0,
      currency: "BRL",
      status: "EXPIRED",
      adjustmentType: "FIXED_PERCENT",
      adjustmentValue: 8.0,
      costCenter: "Financeiro",
      tags: ["seguro", "protecao"],
      notes: "Seguro contra incêndio e roubo.",
    },
  });

  // Create canceled contract
  console.log("🚫 Creating canceled contract...");
  const contract6 = await prisma.contract.create({
    data: {
      orgId: orgBR.id,
      title: "Software de CRM Antigo",
      counterpartyName: "CRM Solutions Inc",
      counterpartyContact: "suporte@crmsolutions.com",
      ownerUserId: manager.id,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2024-06-01"),
      autoRenew: false,
      periodicityDays: 365,
      valueAmount: 18000.0,
      currency: "BRL",
      status: "CANCELED",
      adjustmentType: "NONE",
      costCenter: "Vendas",
      tags: ["software", "crm", "descontinuado"],
      notes: "Substituído por novo sistema.",
    },
  });

  // Create renewal history
  console.log("🔄 Creating renewal history...");
  await prisma.renewalHistory.create({
    data: {
      contractId: contract1.id,
      orgId: orgBR.id,
      previousEndDate: new Date("2024-01-15"),
      newEndDate: new Date("2025-01-15"),
      renewalDate: new Date("2024-01-10"),
      renewedBy: owner.id,
    },
  });

  // Create adjustments
  console.log("📈 Creating adjustments...");
  await prisma.contractAdjustment.create({
    data: {
      contractId: contract1.id,
      orgId: orgBR.id,
      oldValue: 47500.0,
      newValue: 50000.0,
      percentage: 5.26,
      adjustmentDate: new Date("2024-01-15"),
      appliedBy: owner.id,
      reason: "Reajuste anual conforme contrato",
    },
  });

  await prisma.contractAdjustment.create({
    data: {
      contractId: contract5.id,
      orgId: orgBR.id,
      oldValue: 23150.0,
      newValue: 25000.0,
      percentage: 8.0,
      adjustmentDate: new Date("2024-01-01"),
      appliedBy: owner.id,
      reason: "Reajuste por inflação",
    },
  });

  // Create contract files
  console.log("📎 Creating contract files...");
  await prisma.contractFile.create({
    data: {
      contractId: contract1.id,
      orgId: orgBR.id,
      fileName: "contrato-marketing-assinado.pdf",
      mimeType: "application/pdf",
      fileType: "MAIN",
      sizeBytes: 524288, // 512 KB
      fileContent: "", // Empty base64 content for seed data
      checksum: "abc123def456",
      uploadedBy: owner.id,
    },
  });

  await prisma.contractFile.create({
    data: {
      contractId: contract2.id,
      orgId: orgBR.id,
      fileName: "licenca-microsoft-365.pdf",
      mimeType: "application/pdf",
      fileType: "MAIN",
      sizeBytes: 358400, // 350 KB
      fileContent: "", // Empty base64 content for seed data
      checksum: "def456abc789",
      uploadedBy: admin.id,
    },
  });

  // Create notifications
  console.log("🔔 Creating notifications...");
  await prisma.notification.create({
    data: {
      userId: admin.id,
      orgId: orgBR.id,
      eventType: "CONTRACT_DUE_SOON",
      channel: "EMAIL",
      status: "SENT",
      title: "Contrato vencendo em breve",
      message: 'O contrato "Contrato de Limpeza" vence em 45 dias.',
      metadata: { contractId: contract4.id },
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: owner.id,
      orgId: orgBR.id,
      eventType: "CONTRACT_EXPIRED",
      channel: "IN_APP",
      status: "READ",
      title: "Contrato vencido",
      message: 'O contrato "Seguro Empresarial" está vencido.',
      metadata: { contractId: contract5.id },
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      readAt: new Date(),
    },
  });

  // Create audit logs
  console.log("📝 Creating audit logs...");
  await prisma.auditLog.create({
    data: {
      userId: owner.id,
      orgId: orgBR.id,
      action: "CREATE",
      entityType: "Contract",
      entityId: contract1.id,
      metadata: { title: "Contrato de Marketing Digital" },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      orgId: orgBR.id,
      action: "RENEW",
      entityType: "Contract",
      entityId: contract1.id,
      metadata: { previousEndDate: "2024-01-15", newEndDate: "2025-01-15" },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: manager.id,
      orgId: orgBR.id,
      action: "DELETE",
      entityType: "Contract",
      entityId: contract6.id,
      metadata: { reason: "Substituído por novo sistema" },
    },
  });

  // Create invitations (pending)
  console.log("✉️ Creating pending invitations...");
  await prisma.invitation.create({
    data: {
      orgId: orgBR.id,
      email: "novo.usuario@empresa.com",
      role: "VIEWER",
      token: nanoid(32),
      inviterId: owner.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
    },
  });

  // Create US organization
  console.log("🇺🇸 Creating US organization...");
  const ownerUS = await prisma.user.create({
    data: {
      email: "owner@testcompany.com",
      name: "John Smith",
      emailVerified: new Date(),
    },
  });

  const orgUS = await prisma.org.create({
    data: {
      name: "Test Company Inc",
      slug: "test-company-inc",
      country: "US",
      timezone: "America/New_York",
      locale: "en-US",
      currency: "USD",
      members: {
        create: [
          {
            userId: ownerUS.id,
            role: "OWNER",
          },
        ],
      },
    },
  });

  // Create US contract
  console.log("📄 Creating US contract...");
  await prisma.contract.create({
    data: {
      orgId: orgUS.id,
      title: "SaaS Subscription",
      counterpartyName: "CloudService Inc",
      counterpartyContact: "support@cloudservice.com",
      ownerUserId: ownerUS.id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-07-01"),
      nextRenewalDate: new Date("2024-07-01"),
      periodicityDays: 30,
      autoRenew: true,
      valueAmount: 499.0,
      currency: "USD",
      status: "ACTIVE",
      adjustmentType: "NONE",
      costCenter: "IT",
      tags: ["software", "cloud", "subscription"],
      notes: "Monthly SaaS subscription for project management.",
    },
  });

  // Create alert logs
  console.log("📨 Creating alert logs...");
  await prisma.alertLog.create({
    data: {
      orgId: orgBR.id,
      contractId: contract4.id,
      eventType: "CONTRACT_DUE_SOON",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // -15 days
      processed: true,
    },
  });

  // Create cron job logs
  // Create cron job log
  console.log("⏰ Creating cron job log...");
  await prisma.cronJob.create({
    data: {
      jobName: "check-contract-alerts",
      status: "success",
      duration: 1542, // milliseconds
      processedOrgs: 2,
      metadata: { totalContracts: 7, alertsSent: 2 },
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Organizations: ${await prisma.org.count()}`);
  console.log(`- Contracts: ${await prisma.contract.count()}`);
  console.log(
    `- Active Contracts: ${await prisma.contract.count({
      where: { status: "ACTIVE" },
    })}`
  );
  console.log(
    `- Expiring Soon: ${await prisma.contract.count({
      where: { status: "DUE_SOON" },
    })}`
  );
  console.log(
    `- Expired: ${await prisma.contract.count({
      where: { status: "EXPIRED" },
    })}`
  );
  console.log(`- Notifications: ${await prisma.notification.count()}`);
  console.log(`- Audit Logs: ${await prisma.auditLog.count()}`);
  console.log("\n👥 Test Users (BR org):");
  console.log(`- Owner: owner@contratei.com`);
  console.log(`- Admin: admin@contratei.com`);
  console.log(`- Manager: manager@contratei.com`);
  console.log(`- Viewer: viewer@contratei.com`);
  console.log("\n👥 Test Users (US org):");
  console.log(`- Owner: owner@testcompany.com`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1739261200598 implements MigrationInterface {
    name = 'CreateTables1739261200598'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sharedspacemembers\` (\`UserId\` int NOT NULL, \`SharedspaceId\` int NOT NULL, \`RoleId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`UserId\`, \`SharedspaceId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`joinrequests\` (\`id\` int NOT NULL AUTO_INCREMENT, \`SharedspaceId\` int NOT NULL, \`RequestorId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`message\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`images\` (\`id\` int NOT NULL AUTO_INCREMENT, \`path\` text NOT NULL, \`ChatId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, \`SenderId\` int NULL, \`SharedspaceId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sharedspaces\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NOT NULL DEFAULT '새 스페이스', \`url\` varchar(5) NOT NULL, \`private\` tinyint NOT NULL DEFAULT '1', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`OwnerId\` int NULL, INDEX \`sharedspaces_OwnerId_idx\` (\`OwnerId\`), UNIQUE INDEX \`sharedspaces_url_idx\` (\`url\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`todos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`description\` text NOT NULL, \`date\` date NOT NULL, \`startTime\` time NOT NULL, \`endTime\` time NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`AuthorId\` int NULL, \`EditorId\` int NULL, \`SharedspaceId\` int NOT NULL, INDEX \`todos_SharedspaceId_idx\` (\`SharedspaceId\`), INDEX \`todos_date_idx\` (\`date\`), INDEX \`todos_AuthorId_idx\` (\`AuthorId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(30) NOT NULL, \`password\` varchar(100) NULL, \`provider\` varchar(255) NOT NULL, \`profileImage\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`users_email_idx\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`RoleId\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`deletedAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`RoleId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_6d908595f29fddce893850c9b8\` ON \`sharedspacemembers\` (\`UserId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_bbefebd3776188014185ec1839\` ON \`sharedspacemembers\` (\`SharedspaceId\`)`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD CONSTRAINT \`FK_6d908595f29fddce893850c9b86\` FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD CONSTRAINT \`sharedspacemembers_SharedspaceId_fk\` FOREIGN KEY (\`SharedspaceId\`) REFERENCES \`sharedspaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD CONSTRAINT \`sharedspacemembers_RoleId_fk\` FOREIGN KEY (\`RoleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`joinrequests\` ADD CONSTRAINT \`joinrequests_SharedspaceId_fk\` FOREIGN KEY (\`SharedspaceId\`) REFERENCES \`sharedspaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`joinrequests\` ADD CONSTRAINT \`joinrequests_RequestorId_fk\` FOREIGN KEY (\`RequestorId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`images\` ADD CONSTRAINT \`images_ChatId_fk\` FOREIGN KEY (\`ChatId\`) REFERENCES \`chats\`(\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`chats\` ADD CONSTRAINT \`chats_SenderId_fk\` FOREIGN KEY (\`SenderId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`chats\` ADD CONSTRAINT \`chats_SharedspaceId_fk\` FOREIGN KEY (\`SharedspaceId\`) REFERENCES \`sharedspaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`sharedspaces\` ADD CONSTRAINT \`sharedspaces_OwnerId_fk\` FOREIGN KEY (\`OwnerId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`todos\` ADD CONSTRAINT \`todos_AuthorId_fk\` FOREIGN KEY (\`AuthorId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`todos\` ADD CONSTRAINT \`todos_EditorId_fk\` FOREIGN KEY (\`EditorId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`todos\` ADD CONSTRAINT \`todos_SharedspaceId_fk\` FOREIGN KEY (\`SharedspaceId\`) REFERENCES \`sharedspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD CONSTRAINT \`FK_bbefebd3776188014185ec18398\` FOREIGN KEY (\`SharedspaceId\`) REFERENCES \`sharedspaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP FOREIGN KEY \`FK_bbefebd3776188014185ec18398\``);
        await queryRunner.query(`ALTER TABLE \`todos\` DROP FOREIGN KEY \`todos_SharedspaceId_fk\``);
        await queryRunner.query(`ALTER TABLE \`todos\` DROP FOREIGN KEY \`todos_EditorId_fk\``);
        await queryRunner.query(`ALTER TABLE \`todos\` DROP FOREIGN KEY \`todos_AuthorId_fk\``);
        await queryRunner.query(`ALTER TABLE \`sharedspaces\` DROP FOREIGN KEY \`sharedspaces_OwnerId_fk\``);
        await queryRunner.query(`ALTER TABLE \`chats\` DROP FOREIGN KEY \`chats_SharedspaceId_fk\``);
        await queryRunner.query(`ALTER TABLE \`chats\` DROP FOREIGN KEY \`chats_SenderId_fk\``);
        await queryRunner.query(`ALTER TABLE \`images\` DROP FOREIGN KEY \`images_ChatId_fk\``);
        await queryRunner.query(`ALTER TABLE \`joinrequests\` DROP FOREIGN KEY \`joinrequests_RequestorId_fk\``);
        await queryRunner.query(`ALTER TABLE \`joinrequests\` DROP FOREIGN KEY \`joinrequests_SharedspaceId_fk\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP FOREIGN KEY \`sharedspacemembers_RoleId_fk\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP FOREIGN KEY \`sharedspacemembers_SharedspaceId_fk\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP FOREIGN KEY \`FK_6d908595f29fddce893850c9b86\``);
        await queryRunner.query(`DROP INDEX \`IDX_bbefebd3776188014185ec1839\` ON \`sharedspacemembers\``);
        await queryRunner.query(`DROP INDEX \`IDX_6d908595f29fddce893850c9b8\` ON \`sharedspacemembers\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`deletedAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` DROP COLUMN \`RoleId\``);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`sharedspacemembers\` ADD \`RoleId\` int NOT NULL`);
        await queryRunner.query(`DROP INDEX \`users_email_idx\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`todos_AuthorId_idx\` ON \`todos\``);
        await queryRunner.query(`DROP INDEX \`todos_date_idx\` ON \`todos\``);
        await queryRunner.query(`DROP INDEX \`todos_SharedspaceId_idx\` ON \`todos\``);
        await queryRunner.query(`DROP TABLE \`todos\``);
        await queryRunner.query(`DROP INDEX \`sharedspaces_url_idx\` ON \`sharedspaces\``);
        await queryRunner.query(`DROP INDEX \`sharedspaces_OwnerId_idx\` ON \`sharedspaces\``);
        await queryRunner.query(`DROP TABLE \`sharedspaces\``);
        await queryRunner.query(`DROP TABLE \`chats\``);
        await queryRunner.query(`DROP TABLE \`images\``);
        await queryRunner.query(`DROP TABLE \`joinrequests\``);
        await queryRunner.query(`DROP TABLE \`sharedspacemembers\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}

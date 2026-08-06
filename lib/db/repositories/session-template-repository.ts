import { db } from "../database";
import type { SessionTemplate, WizardFormData } from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class SessionTemplateRepository {
  async getAll(): Promise<SessionTemplate[]> {
    return db.sessionTemplates.orderBy("templateName").toArray();
  }

  async create(templateName: string, data: WizardFormData): Promise<SessionTemplate> {
    const now = new Date().toISOString();
    const template: SessionTemplate = {
      ...data,
      id: generateId(),
      templateName: templateName.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await db.sessionTemplates.add(template);
    return template;
  }

  async remove(id: string): Promise<void> {
    await db.sessionTemplates.delete(id);
  }
}

export const sessionTemplateRepository = new SessionTemplateRepository();

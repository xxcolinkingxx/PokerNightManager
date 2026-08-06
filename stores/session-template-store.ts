import { create } from "zustand";

import { sessionTemplateRepository } from "@/lib/db/repositories/session-template-repository";
import type { SessionTemplate, WizardFormData } from "@/lib/session/types";

interface SessionTemplateStoreState {
  templates: SessionTemplate[];
  isLoading: boolean;
  loadTemplates: () => Promise<void>;
  saveTemplate: (templateName: string, data: WizardFormData) => Promise<SessionTemplate>;
  removeTemplate: (id: string) => Promise<void>;
}

export const useSessionTemplateStore = create<SessionTemplateStoreState>((set) => ({
  templates: [],
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true });
    const templates = await sessionTemplateRepository.getAll();
    set({ templates, isLoading: false });
  },

  saveTemplate: async (templateName, data) => {
    const template = await sessionTemplateRepository.create(templateName, data);
    set((state) => ({
      templates: [...state.templates, template].sort((a, b) =>
        a.templateName.localeCompare(b.templateName),
      ),
    }));
    return template;
  },

  removeTemplate: async (id) => {
    await sessionTemplateRepository.remove(id);
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));

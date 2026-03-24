export interface GrammarGroupItem {
    grammarGroupID: string;
    groupName: string;
    description?: string;
    usageCount: number;
}

export interface CreateUpdateGrammarGroupDTO {
    groupName: string;
    description: string;
}
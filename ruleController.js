public with sharing class ruleController {
    @AuraEnabled(cacheable = true)
    public static List<UI_Rules__mdt> getRules() {
        List<UI_Rules__mdt> lstRules = [SELECT ruleName__c, ruletype__c, targetFieldName__c, 
        targetFieldValue__c,conditionField__c FROM UI_Rules__mdt];
        return [SELECT ruleName__c,ruletype__c, targetFieldName__c, 
        targetFieldValue__c,conditionField__c FROM UI_Rules__mdt];

    }
}

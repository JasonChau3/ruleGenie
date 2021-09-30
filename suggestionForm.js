import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRules from '@salesforce/apex/ruleController.getRules';
//ultimate question is how do i group these right. How does the user put in that they want to group it
var ruleArray = [];
//     {
//      "Id__c":"readOnlyRule",
//      "ruletype__c":"readOnlyRule",            
//      "targetFieldName__c":"Suggestion_Description","conditionField":"Status = New or Suggestion_Category = Other",
//      "targetFieldValue__c":"",
//      "Type":"Input"
//   },
//   {
//      "Id__c":"defaultValue",
//      "ruletype__c":"defaultValue",            
//      "targetFieldName__c":"Status","targetFieldValue":"Implemented",
//      "conditionField__c":"NumberDa   <=   5    and Suggestion_Category = Other",
//      "Type__c":"Output"
//   },
//   //two ways of doing complex conditions  

//   /*first way is to have more attriubtes of conditionfield with naming convention of 
//    conditionField1, conditionFieldValue1, ...2 etc
//    */
//   /*
//   Second way is having the conditionField and conditionFieldValue be an arrayof strings
//    and then we map each element from the conditionField to conditionFieldValue.
//    e.g let conditionField = ["hi","bye"] and conditionFieldValue = ["new", "old"]
//    the values would be mapped like this: hi -> new, bye ->old
//   */
//   {
//      "Id__c":"requiredField",
//      "ruletype__c":"requiredField",            
//      "targetFieldName__c":"Suggestion_Description","targetFieldValue":"","conditionField":"Suggestion_Category = Customer Service",
//      "Type__c":"Output"
//   },
  
//   {
//      "Id__c":"hiddenField",
//      "ruletype__c":"hiddenField",   
//      "targetFieldName__c":"Suggestion_Description","targetFieldValue":"",
//      "conditionField__c":"Status = In Progress and Suggestion_Category = Employee Services and NumberDa >= 5 or Active  =  true",
//      "Type__c":"Output"
//   }
  
//  ];
export default class suggestionForm extends LightningElement {
    @wire(getRules)
    ruleArra;
    handleSuccess(event) {
        //creates a toastevent for when the rule object is sucessfully created.
        const toastEvent = new ShowToastEvent({
            title: "New Suggestion has been created",
            message: `Record ID: " ${event.detail.id}`,
            variant: "success"
        });

        this.dispatchEvent(toastEvent);

        //grabs all the values of the input fields
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );


        //clears all the values of the input field
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }
    createRuleArr(){
        //put the rulenames that you want to use in this array.
        let arr = ['hideOtherFields','readOnlyBadCS','requireFieldSalesforce','defaultBadFood'];
        // let arr = ['complexRule'];
        console.log('in create RUle array')

        this.handleRuleEval(arr);
    }
    handleRuleEval(ruleIdArray){
        
        //string manipulation for the condition string, to get the values
        //into seperate arrays.


         for (let x = 0; x < ruleIdArray.length; x++ ){
            let ruleObj = this.getRuleById(ruleIdArray[x])[0];
            //split the text and the and or conditions but have to keep the condition
            let cond = [];
            if (ruleObj.conditionField__c != null){
                cond = ruleObj.conditionField__c.split(/(?= and)|(?= or)/);
            }
            
            //conditionField should contain the id of all the fields we want to check the conditions on
            let conditionField = [];
            //conditionFieldValue should be an array of the expected values for conditionField
            let conditionFieldValue = [];
            //conditionType is if its joined by and/or
            let conditionType = [];
            //joinVal is the signs, e.g <=, = ,=> >,<

            let joinVal = [];
            console.log(cond);
            
            
            for (let y = 0; y < cond.length; y++){
                cond[y] = cond[y].replace(/[()]/g,'');
                // the signs can have more than one space or zero spaces
                //the and/or has to have at least one space.
                joinVal.push(cond[y].match(/\s*>=|\s*<=|[=<>]/)[0].trim());

                //and/or won't be in the first element of the array
                if (  y != 0 ){
                    conditionType.push(cond[y].match(/\s+and|\s+or/)[0].trim());
                    cond[y] = cond[y].replace(/\s+and|\s+or/, '');
                }
                let sepStr =  cond[y].split(/\s*>=|\s*<=|[=<>]/);
                conditionField.push(`lightning-input-field[data-my-id=id${sepStr[0].trim()}`);
                conditionFieldValue.push(sepStr[1].trim());
            }
            
            //targetFieldId is the field that we want to change properties on.
            let targetFieldId=`lightning-input-field[data-my-id=id${ruleObj.targetFieldName__c}]`;
           
            console.log(ruleObj.ruletype__c);
            // [ 'readOnly' , 'default value']
            //first rule here is making the field read only
            if (ruleObj.ruletype__c == "readOnlyRule"){
                
                this.ruleHandler(targetFieldId,conditionField, conditionFieldValue, 'disabled',conditionType, joinVal);
              }
            
              //second rule here
              //on html run this once the dom is loaded
            else if (ruleObj.ruletype__c == "defaultValue"){
                let targetVal = ruleObj.targetFieldValue__c;
                this.ruleHandler(targetFieldId, conditionField, conditionFieldValue, 'value',conditionType,joinVal, targetVal);
            }

            else if (ruleObj.ruletype__c == "requiredField"){
              this.ruleHandler(targetFieldId, conditionField, conditionFieldValue, 'required',conditionType, joinVal);
            }
              //hiding the field is a bit hard unless i find a different way instead of the if true:false{}
            else if (ruleObj.ruletype__c == "hiddenField") {
              this.ruleHandler(targetFieldId, conditionField, conditionFieldValue, 'hidden', conditionType, joinVal);
            }

            }
          }
    //side note
    //seem to be using alot of the same code in these functions maybe I can combine them into one function
    //maybe map the rule names to the neccessary attributes?
    //doing a setter to make it easier?

    /*
    This is a helper function that gets the json object of a matched id
    */
    getRuleById(Id) {
        let rules = JSON.parse(JSON.stringify(this.ruleArra));
        ruleArray = rules.data;

        return ruleArray.filter(rule => rule.ruleName__c == Id);
            // function(ruleArray){ return ruleArray.Id__c == id }
        // );
    }
    /*
     *@Return None
     *@Parameters 
     * targetId - a String of the id for the field that we want to change properties on
     * attribute - what attribute of the field we want to change
     * value -  the value to set the attribute to
     * 
     * This method sets a field's attribute to a value based on a condition. If there is no condition, then we 
     * will simply set the value of the field's attribute. 
     * */
    setValue(targetId, attribute, value){

        //instead of using if statements, we can use switch cases.

        if ( attribute === 'required'){
            this.template.querySelector(targetId).required = value;
        }
        else if ( attribute === 'disabled'){

            
            this.template.querySelector(targetId).disabled = value;
        }
        else if (attribute === 'value'){
            this.template.querySelector(targetId).value = value;
        }
        else if  (attribute == 'hidden'){
            if (value == true){
                this.template.querySelector(targetId).className = 'slds-hide';
            }
            else {
                this.template.querySelector(targetId).className = '';

            }
        }
    }
          
    /*
     *@Return None
     *@Parameters 
     * targetId - a String of the id for the field that we want to change properties on
     * conditionId - an array  of the id for the field that we want to check properties on
     * condition - an array of values that we want to check that the conditionId object has
     * attribute - the attribute that we want to change
     * targetValue - what we want the attribtue value to be
     * 
     * This method sets a field to be required based on a condition. If there is no condition, then we 
     * will simply turn the targetId object to be required. 
     * */
    ruleHandler(targetId, conditionId, condition, attribute,conditionType,joinVal, targetValue = null){
        //call on helper function to check if all conditions pass

        let allPass = this.multConditions(conditionId,condition,conditionType,joinVal);
        
        if (allPass == false &&  targetValue ==  null){
            this.setValue(targetId, attribute, false);
        }

        else if(allPass == true){
            this.setValue(targetId, attribute, targetValue != null ? targetValue : true);
        }

        }



    // /*
    //  *@Return None
    //  *@Parameters 
    //  * targetId - a String of the id for the field that we want to change properties on
    //  * conditionId - a String of the id for the field that we want to check properties on
    //  * condition - the value that we want to check that the conditionId object has
    //  * 
    //  * This method sets a field to read only based on a condition. If there is no condition, then we 
    //  * will simply turn the targetId object into read-only. 
    //  * */
    // makeReadOnly(targetId,conditionId, condition) {
    //   //if there is no condition then we just disable the field
    //   if (condition === "" || conditionId === "") {
    //     this.template.querySelector(targetId).disabled = true;
    //   }

    //   //otherwise disable based on condition
    //   else if(this.template.querySelector(conditionId).value === condition)
    //   {
    //     this.template.querySelector(targetId).disabled = true;
      
    //   }
    //   else{
    //     this.template.querySelector(targetId).disabled = false;
    //   }
    // }



    changeHandler(event) {
        //this.greeting = event.target.value;
        this.handleRuleEval('readOnlyRuleStartDate');
        
    }

    //let arr1 be an array of ids of the fields
    //let arr2 be the values that we want the field to be
    //two ways we can go with this method. Have it be a helper method to the setting value
    // or make it actually set the value


    //so there are probably two ways to handle this.

    /*
        1. have an array that matches the and and or with the array, 
        -problem with this is we don't know how to match the and/or with which condition

        -solution to this problem
        in the condition value, we would have a string in it, where the first value would
        have the index in the array and the last value would be an index of the array with
        the key word and/or in it
        
        2. Json object/ dictionary that basically has a key with which field and if it is
        and/or.
        -problem with this is that there could be multiple and/ or , so we wouldn't know which
        conditions to match with the and/or.

        -solution with this problem
        if we use the json object we can have multiple fields that can indicate what it would
        match to

    */


    /*
     *@Return Boolean
     *@Parameters 
     * condValOne - This is the value of the conditionField
     * expecValOne - This is the expected Value of the condition Field
     * sign - the sign to check the value of condValueOne with expecValOne
     * 
     * */
    or(condValOne, expecValOne, sign){
        if (condValOne == null){
            //if it is null then we should return false
            return false;
        }
        if (sign == '='){
            return (condValOne.toString() == expecValOne);
        }
        else if ( sign == '>'){
            return (parseInt(condValOne) > parseInt(expecValOne));
        }
        else if ( sign == '<='){
            return (parseInt(condValOne) <= parseInt(expecValOne));
        }
        else if ( sign == '>='){
            return (parseInt(condValOne) >= parseInt(expecValOne));
        }
        //last condition if sign is <
        return (parseInt(condValOne) < parseInt(expecValOne));
    
    }
    /*
     *@Return Boolean
     *@Parameters 
     * condVal - an array of conditions to be checked
     * expecVal - an array of expected  values 
     * joinVal - an array of and/or that the conditions are joined  by
     * sign - an array of signs that the conditions are joined by
     * 
     * */
    multConditions(condVal,expecVal,joinVal,signArr){
        //base conditions where there is no conditions.
        if (condVal.length == 0){
            return true;
        }

        //base condition where there is only one conditio
        if ( joinVal.length == 0){
            let val= this.template.querySelector(condVal[0]).value;
            return (val == expecVal[0])
        }
//[1,2,3,4]  [2,3,4,5] [this.and,or,or]
//condition where there are multiple conditions
//check this fcondition False and True or False should return False

        let condField = this.template.querySelector(condVal[0]).value;
        let bool = this.or(condField,expecVal[0],signArr[0]);
        for (let x = 1; x<=condVal.length-1; x++){
            condField = this.template.querySelector(condVal[x]).value;
            if (joinVal[x-1] == 'and'){
                bool = bool && this.or(condField,expecVal[x], signArr[x]);
            }
            else if (joinVal[x-1] == 'or'){
                bool = bool || this.or(condField,expecVal[x], signArr[x]);
            }

        }
        return bool;
    }

   
}
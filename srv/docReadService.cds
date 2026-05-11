using { sms.aidocread.db as db } from '../db/schema';

service docReadService {

    @odata.draft.enabled  
    entity zdocument as projection on db.zdocument actions{
    @Common.SideEffects:{TargetProperties:['aiAnwer']}
    action ask(Question: String) returns String;

    };

   

    
}

//MASS DOCUMENT DELETION SCRIPT
//Author: Allen White
//Created: 11/1/2022
//
//This script utilizes a named view to loop through documents in the view and delete them
//Dry run option is provided to simulate deleting documents
//
//NOTE: Check destruction.wait.time in inserverFS.ini to check how long the deleted docs will be kept
//and adjust if required. The default set by admin is 60 days but it may be best to set it to 0 while 
//deletion runs then reset to 60 after. 
//
//NOTE2: Set the view limit to the max of 2000 documents

// Dry Run for Testing
var DRY_RUN = false;  //true = log how many docs WOULD be deleted, but don't actually delete them

// View Configuration
var VIEW_NAME = "_DelTestView"; //View used to search for related documents and is sorted by document id ascending
var VIEW_CATEGORY = "DOCUMENT"; //DOCUMENT or PROJECT

/**
 * Main body of script.
 * @method main
 * @return {Boolean} True on success, false on error.
 */

 function main ()
 {
    printf("\n=============================");
    printf("\nMASS DOCUMENT DELETION SCRIPT");
    printf("\n=============================\n\n");

    //Indicate whether dry or live run is enabled
    switch(DRY_RUN)
    {
        case true:
            printf("Dry run enabled. Documents will NOT be deleted. Press Ctrl-C to break.\nValidating view...\n");
            break;
        case false:
            printf("LIVE RUN enabled. Documents WILL BE destroyed. Press Ctrl-C to break.\nValidating view...\n");
            break;
    }

    try
    {
        //Create instance of view with given name and category
        var view = new INView(VIEW_NAME, VIEW_CATEGORY);

        //Test to see if view exists before looping
        switch(view.run())
        {
            case true: 
                printf("View exists, continuing execution...\n");
                break;
            case false:
                printf("ERROR: View " + VIEW_NAME + " doesn't exist. Execution halted.\n");
                throw "Invalid view name";
        }

        var moreResults = false;
        var docCount = 0; //Displayed counter of documents processed

        do //Loop while the view still has more results than the limit
        {
            //Create instance of view with given name and category
            var view = new INView(VIEW_NAME, VIEW_CATEGORY);

            //Execute the view
            switch(view.run())
            {
                case true:
                    printf("View execution successful...\n");
                    break;
                case false:
                    printf("Execution of view failed.\n");
                    throw "Recursive execution of view failed.";     
            }

            do //Loop through all docs returned in the current view run up to the limit
            { 
                moreResults = false;

                while (view.NextResult())
                {
                    var objId;
                    objId = view.CurrentResultString("Document ID");
      
                    if (objId == '') continue; //objId is blank on the last iteration
                    moreResults = true;
                    lastId = objId;
      
                    //get current object
                    var docToRemove;
                    docToRemove = new INDocument(objId);
                    docToRemove.getInfo();

                    //Either simulate deleting documents or actually delete documents
                    //depending on if dry run is enabled
                    switch(DRY_RUN)
                    {  
                        case true:
                            printf("DRY RUN: Would have removed document: %s\n", docToRemove.id);
                            docCount = docCount + 1;
                            printf(docCount + " ");
                            break;
                        case false:
                            switch(docToRemove.remove())
                            {
                                case true:
                                    printf("Removed document: %s\n", docToRemove.id);
                                    docCount = docCount + 1;
                                    printf(docCount + " ");
                                    break;
                                case false:
                                    printf("ERROR - could not remove document: %s\.n",
                                    getErrMsg());
                                    break;
                            }
                            break;
                        }
                    }
            } while(moreResults == true);
        } while(view.HasMoreResults());
    }
    catch(e)
    {
        printf("\n\nFATAL ERROR: %s\n\n", e.toString());
    }
    finally
    {
        printf("\n\nExecution complete.");
    }
}

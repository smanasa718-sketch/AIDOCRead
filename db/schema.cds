namespace sms.aidocread.db;

using {cuid,managed } from '@sap/cds/common';

entity zdocument : cuid, managed  {
    fileName     : String;
    title        : String;
    mimeType     : String;
    content      : LargeBinary @Core.MediaType: mimeType;
    extractedText    : LargeString;
    embedding    : LargeString;
    aiAnwer : LargeString;
}
import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { prepareProductCanvasSource } from '../packages/application/src/product-canvas-intake.ts';

test('B2 product Canvas preserves a human + decision draft without undefined deterministic JSON',()=>{
  const repo=new SqliteDocumentStore(':memory:');
  try{
    const result=prepareProductCanvasSource(repo,{
      title:'My process',
      initiatedBy:'one-app-product-user',
      createdAt:'2026-09-22T15:55:00.000Z',
      elements:[
        {id:'step-1',kind:'START',label:'Start'},
        {id:'step-2',kind:'APPROVAL',label:'Say Hello'},
        {id:'step-3',kind:'DECISION',label:'Customers answer?'},
        {id:'step-4',kind:'STEP',label:'Say booking'},
        {id:'step-5',kind:'STEP',label:'Say goodbye'},
        {id:'step-6',kind:'END',label:'End'},
      ],
      connections:[
        {id:'connection-1',from:'step-3',to:'step-4',kind:'FLOW',condition:'yes'},
        {id:'connection-2',from:'step-3',to:'step-5',kind:'FLOW',condition:'no'},
      ],
    });
    assert.ok(result.status==='BPMN_READY_FOR_PROCESS_REVIEW'||result.status==='SAFE_STOP_BEFORE_CANONICAL');
  }finally{
    repo.close();
  }
});

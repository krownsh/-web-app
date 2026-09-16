/**
 * Google Apps Script for Zen Travel App API
 * ----------------------------------------
 * This script serves as a JSON API for the travel application to manage
 * itinerary, budget records, must-buy lists, and checklist states.
 * 
 * Deployment Instructions:
 * 1. Create a new Google Spreadsheet.
 * 2. Create four sheets: "Itinerary", "MustBuy", "BudgetRecords", and "ChecklistStatus".
 * 3. Add the following headers to the first row of each sheet (Matching docs/database_schema.md):
 *    - Itinerary: id, day, time, title, location, type, description, lat, lng, image_url
 *    - MustBuy: id, item_name, price, location_ref, image_url, visibility, owner_id
 *    - BudgetRecords: id, date, time, title, amount, currency, category, location, payment_type, owner_id, created_at
 *    - ChecklistStatus: item_id, is_checked, owner_id, updated_at
 * 4. Open Extensions -> Apps Script.
 * 5. Paste this code.
 * 6. Replace SPREADSHEET_ID below with your actual spreadsheet ID.
 * 7. Deploy -> New Deployment -> Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Copy the Web App URL and provide it to the app configuration.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  try {
    const sheetName = e.parameter.sheet;
    const ownerId = e.parameter.owner_id;

    if (!sheetName) return errorResponse('Missing sheet parameter');

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return errorResponse('Sheet not found: ' + sheetName);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.length > 1 ? data.slice(1) : [];

    const result = rows.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (val instanceof Date) {
          val = val.toISOString();
        }
        obj[h] = val;
      });
      return obj;
    });

    // Filtering logic based on visibility and ownership as per schema
    let filtered = result;
    if (sheetName === 'MustBuy') {
      filtered = result.filter(item => item.visibility === 'public' || item.owner_id === ownerId);
    } else if (sheetName === 'BudgetRecords') {
      filtered = result.filter(item => item.payment_type === 'public' || item.owner_id === ownerId);
    } else if (sheetName === 'ChecklistStatus') {
      filtered = result.filter(item => item.owner_id === ownerId);
    } else if (sheetName === 'Budgets') {
      filtered = result.filter(item => item.budget_type === 'public' || item.owner_id === ownerId);
    }

    return successResponse(filtered);
  } catch (err) {
    return errorResponse(err.message);
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action; // 'add', 'update', 'delete', 'sync_check', 'sync_budget'
    const sheetName = contents.sheet;
    const payload = contents.data;

    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) return errorResponse('Sheet not found: ' + sheetName);

    const tableData = sheet.getDataRange().getValues();
    const headers = tableData[0];
    const idIndex = headers.indexOf('id');

    if (action === 'add') {
      if (headers.includes('created_at') && !payload.created_at) {
        payload.created_at = new Date().toISOString();
      }
      const row = headers.map(h => payload[h] !== undefined ? payload[h] : '');
      sheet.appendRow(row);
      return successResponse({ status: 'added' });
    }

    if (action === 'update' || action === 'sync_check') {
      const id = payload.id;
      const itemId = payload.item_id;
      const ownerId = payload.owner_id;

      let foundIndex = -1;
      
      // Special logic for budgets: identifier is (budget_type, owner_id)
      if (sheetName === 'Budgets' || action === 'sync_budget') {
        const typeIdx = headers.indexOf('budget_type');
        const ownerIdx = headers.indexOf('owner_id');
        for (let i = 1; i < tableData.length; i++) {
          if (tableData[i][typeIdx] == payload.budget_type && tableData[i][ownerIdx] == payload.owner_id) {
            foundIndex = i;
            break;
          }
        }
      } else if (sheetName === 'ChecklistStatus') {
        const itemIdx = headers.indexOf('item_id');
        const ownerIdx = headers.indexOf('owner_id');
        for (let i = 1; i < tableData.length; i++) {
          if (tableData[i][itemIdx] == itemId && tableData[i][ownerIdx] == ownerId) {
            foundIndex = i;
            break;
          }
        }
      } else {
        // Normal update by id
        for (let i = 1; i < tableData.length; i++) {
          if (tableData[i][idIndex] == id) {
            foundIndex = i;
            break;
          }
        }
      }

      if (foundIndex !== -1) {
        if (headers.includes('updated_at')) payload.updated_at = new Date().toISOString();
        const rowValues = headers.map(h => payload[h] !== undefined ? payload[h] : tableData[foundIndex][headers.indexOf(h)]);
        sheet.getRange(foundIndex + 1, 1, 1, headers.length).setValues([rowValues]);
        return successResponse({ status: 'updated' });
      } else if (action === 'sync_check' || action === 'sync_budget') {
        // If not found in sync, add it
        if (headers.includes('id') && !payload.id) payload.id = 'bgt_' + Date.now();
        if (headers.includes('updated_at')) payload.updated_at = new Date().toISOString();
        const row = headers.map(h => payload[h] !== undefined ? payload[h] : '');
        sheet.appendRow(row);
        return successResponse({ status: 'added_during_sync' });
      }
      return errorResponse('Item not found for update');
    }

    if (action === 'delete') {
      const id = payload.id;
      if (idIndex === -1) return errorResponse('Delete action requires "id" column');
      for (let i = 1; i < tableData.length; i++) {
        if (tableData[i][idIndex] == id) {
          sheet.deleteRow(i + 1);
          return successResponse({ status: 'deleted' });
        }
      }
      return errorResponse('Item not found for deletion');
    }

    return errorResponse('Invalid action');
  } catch (err) {
    return errorResponse(err.message);
  }
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

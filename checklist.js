import { LightningElement, track, api, wire } from 'lwc';
import getChecklistItems from '@salesforce/apex/ChecklistController.getChecklistItems';
import saveChecklistItem from '@salesforce/apex/ChecklistController.saveChecklistItem';
import { refreshApex } from '@salesforce/apex';

export default class ChecklistComponent extends LightningElement {
    @api recordId;
    @track checklistItems = [];
    @track isAddingNew = false;
    @track newLabel = '';
    wiredChecklistItems;

    @wire(getChecklistItems, { recordId: '$recordId' })
    wiredItems(result) {
        this.wiredChecklistItems = result;
        if (result.data) {
            this.checklistItems = result.data;
        } else if (result.error) {
            console.error('Error fetching checklist items', result.error);
        }
    }

    handleCheckboxChange(event) {
        const itemId = event.target.dataset.id;
        const checked = event.target.checked;

        const updatedItem = this.checklistItems.find(item => item.Id === itemId);

        const checklistItemUpdate = {
            Id: updatedItem.Id,
            Label__c: updatedItem.Label__c,
            RecordId__c: updatedItem.RecordId__c || this.recordId,
            Checked__c: checked
        };

        saveChecklistItem({ checklistItem: checklistItemUpdate })
            .then(() => {
                this.refreshChecklistItems();
            })
            .catch(error => {
                console.error('Error saving checklist item', error);
            });
    }

    handleLabelChange(event) {
        this.newLabel = event.target.value;
    }

    handleNewCheckbox() {
        this.isAddingNew = true;
    }

    saveNewChecklistItem() {
        console.log('Add button clicked');
        console.log('New Label:', this.newLabel);

        if (!this.newLabel) {
            console.error('Label cannot be empty');
            return;
        }

        const newItem = {
            Label__c: this.newLabel,
            RecordId__c: this.recordId,
            Checked__c: false
        };

        saveChecklistItem({ checklistItem: newItem })
            .then(() => {
                this.newLabel = '';
                this.isAddingNew = false;
                console.log('Item saved successfully');
                return refreshApex(this.wiredChecklistItems);
            })
            .catch(error => {
                console.error('Error saving new checklist item', error);
            });
    }

    refreshChecklistItems() {
        return refreshApex(this.wiredChecklistItems);
    }
}

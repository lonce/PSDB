class Contextual{
    /**
     * Creates a new contextual menu
     * @param {object} opts options which build the menu e.g. position and items
     * @param {number} opts.width sets the width of the menu including children
     * @param {boolean} opts.isSticky sets how the menu apears, follow the mouse or sticky
     * @param {Array<ContextualItem>} opts.items sets the default items in the menu
     */
    constructor(opts){   
        contextualCore.CloseMenu();

        this.position = opts.isSticky != null ? opts.isSticky : false;
        this.menuControl = contextualCore.CreateEl(`<div class='contextualJs contextualMenu'></div>`);
        this.menuControl.style.width = opts.width != null ? opts.width : '200px';
        opts.items.forEach(i => {
            let item = new ContextualItem(i);
            this.menuControl.appendChild(item.element);
        });
            
        if(event != undefined){
            event.stopPropagation()
            document.body.appendChild(this.menuControl);
            contextualCore.PositionMenu(this.position, event, this.menuControl);        
        }

        document.onclick = function(e){
            if(!e.target.classList.contains('contextualJs')){
                contextualCore.CloseMenu();
            }
        }    
    }
    /**
     * Adds item to this contextual menu instance
     * @param {ContextualItem} item item to add to the contextual menu
     */
    add(item){
        this.menuControl.appendChild(item.element);
    }
    /**
     * Makes this contextual menu visible
     */
    show(){
        event.stopPropagation()
        document.body.appendChild(this.menuControl);
        contextualCore.PositionMenu(this.position, event, this.menuControl);    
    }
    /**
     * Hides this contextual menu
     */
    hide(){
        event.stopPropagation()
        contextualCore.CloseMenu();
    }
    /**
     * Toggle visibility of menu
     */
    toggle(){
        event.stopPropagation()
        if(this.menuControl.parentElement != document.body){
            document.body.appendChild(this.menuControl);
            contextualCore.PositionMenu(this.position, event, this.menuControl);        
        }else{
            contextualCore.CloseMenu();
        }
    }
}  
class ContextualItem{
    element;
    /**
     * 
     * @param {Object} opts
     * @param {string} [opts.label]
     * @param {string} [opts.type]
     * @param {string} [opts.markup]
     * @param {string} [opts.icon]
     * @param {string} [opts.cssIcon]
     * @param {string} [opts.shortcut]
     * @param {void} [opts.onClick]
     * @param {boolean} [opts.enabled]
     * @param {Array<ContextualItem>} [opts.items]
     * 
     */
    constructor(opts){
        switch(opts.type){
            case 'seperator':
                this.seperator();
                break;
            case 'custom':
                this.custom(opts.markup);
                break;
            case 'multi': 
                this.multiButton(opts.items);
                break;
            case 'submenu':
                this.subMenu(opts.label, opts.items, (opts.icon !== undefined ? opts.icon : ''), (opts.cssIcon !== undefined ? opts.cssIcon : ''), (opts.enabled !== undefined ? opts.enabled : true));
                break;
            case 'normal':
            default:
                this.button(opts.label, opts.onClick, (opts.shortcut !== undefined ? opts.shortcut : ''), (opts.icon !== undefined ? opts.icon : ''), (opts.cssIcon !== undefined ? opts.cssIcon : ''), (opts.enabled !== undefined ? opts.enabled : true));       
        }
    }

    button(label, onClick, shortcut = '', icon = '', cssIcon = '', enabled = true){
        this.element = contextualCore.CreateEl( `
            <div class='contextualJs contextualMenuItemOuter'>
                <div class='contextualJs contextualMenuItem ${enabled == true ? '' : 'disabled'}'>
                    ${icon != ''? `<img src='${icon}' class='contextualJs contextualMenuItemIcon'/>` : `<div class='contextualJs contextualMenuItemIcon ${cssIcon != '' ? cssIcon : ''}'></div>`}
                    <span class='contextualJs contextualMenuItemTitle'>${label == undefined? 'No label' : label}</span>
                    <span class='contextualJs contextualMenuItemTip'>${shortcut == ''? '' : shortcut}</span>
                </div>
            </div>`);               

            if(enabled == true){
                this.element.addEventListener('click', () => {
                    event.stopPropagation();
                    if(onClick !== undefined){ onClick(); }  
                    contextualCore.CloseMenu();
                });
            } 
    }
    custom(markup){
        this.element = contextualCore.CreateEl(`<div class='contextualJs contextualCustomEl'>${markup}</div>`);
    }
    hoverMenu(){
        this.element = ``;
    }
    multiButton(buttons) {
        this.element = contextualCore.CreateEl(`
            <div class='contextualJs contextualMultiItem'>
            </div>
        `);
        buttons.forEach(i => {
            let item = new ContextualItem(i);
            this.element.appendChild(item.element);
        });
    }
    subMenu(label, items, icon = '', cssIcon = '', enabled = true){
        this.element = contextualCore.CreateEl( `
            <div class='contextualJs contextualMenuItemOuter'>
                <div class='contextualJs contextualMenuItem ${enabled == true ? '' : 'disabled'}'>
                    ${icon != ''? `<img src='${icon}' class='contextualJs contextualMenuItemIcon'/>` : `<div class='contextualJs contextualMenuItemIcon ${cssIcon != '' ? cssIcon : ''}'></div>`}
                    <span class='contextualJs contextualMenuItemTitle'>${label == undefined? 'No label' : label}</span>
                    <span class='contextualJs contextualMenuItemOverflow'>
                        <span class='contextualJs contextualMenuItemOverflowLine'></span>
                        <span class='contextualJs contextualMenuItemOverflowLine'></span>
                        <span class='contextualJs contextualMenuItemOverflowLine'></span>
                    </span>
                </div>
                <div class='contextualJs contextualSubMenu contextualMenuHidden'>
                </div>
            </div>`); 

        let childMenu = this.element.querySelector('.contextualSubMenu'),
            menuItem = this.element.querySelector('.contextualMenuItem');

        if(items !== undefined) {
            items.forEach(i => {
                let item = new ContextualItem(i);
                childMenu.appendChild(item.element);
            });
        }
        if(enabled == true){
            menuItem.addEventListener('click',() => {
                menuItem.classList.toggle('SubMenuActive');
                childMenu.classList.toggle('contextualMenuHidden');
            });
        }
    }
    seperator(label, items) {
        this.element = contextualCore.CreateEl(`<div class='contextualJs contextualMenuSeperator'><span></span></div>`);
    }
}

const contextualCore = {
    PositionMenu: (docked, el, menu) => {
        if(docked){
            menu.style.left = ((el.target.offsetLeft + menu.offsetWidth + window.scrollX) >= window.innerWidth) ? 
                ((el.target.offsetLeft - menu.offsetWidth) + el.target.offsetWidth + window.scrollX)+"px"
                    : (el.target.offsetLeft + window.scrollX)+"px";

            menu.style.top = ((el.target.offsetTop + menu.offsetHeight+ window.scrollY) >= window.innerHeight) ?
                (el.target.offsetTop - menu.offsetHeight + window.scrollY)+"px"    
                    : (el.target.offsetHeight + el.target.offsetTop + window.scrollY)+"px";
        }else{
            menu.style.left = ((el.clientX + menu.offsetWidth+ window.scrollX) >= window.innerWidth) ?
                ((el.clientX - menu.offsetWidth + window.scrollX))+"px"
                    : (el.clientX)+"px";

            menu.style.top = ((el.clientY + menu.offsetHeight+ window.scrollY) >= window.innerHeight) ?
                (el.clientY - menu.offsetHeight + window.scrollY)+"px"    
                    : (el.clientY)+"px";
        }
    },
    CloseMenu: () => {
        let openMenuItem = document.querySelector('.contextualMenu:not(.contextualMenuHidden)');
        if(openMenuItem != null){ document.body.removeChild(openMenuItem); }      
    },
    CreateEl: (template) => {
        var el = document.createElement('div');
        el.innerHTML = template;
        return el.firstElementChild;
    }
};

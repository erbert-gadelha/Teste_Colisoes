console.warn("falta calcular a inercia!");

const box = document.getElementById('box');
const c_dot = document.getElementById('dot_count');
const d_rate = document.getElementById('d_rate');
const a_rate = document.getElementById('a_rate');
const s_size = document.getElementById('s_size');

const mousePos = {x:0, y:0};
const rawMouse = {x:0, y:0};

window.addEventListener('mousemove', (event) => {
    var rectBox = box.getBoundingClientRect();

    rawMouse.x = event.clientX - rectBox.left;
    rawMouse.y = event.clientY - rectBox.top;

    mousePos.x = clamp(event.clientX - rectBox.left, Dot.dot_size/2 + 1, rectBox.width) - Dot.dot_size/2 - 2;
    mousePos.y = clamp(event.clientY - rectBox.top , Dot.dot_size/2 + 1, rectBox.height) - Dot.dot_size/2 - 2;
});

class Dot {

    static screen = 10;
    static dot_size = 13.5;
    static gravity = 20;
    static friction = 1;

    constructor(x, y, size) {

        this.position = {
            x: x - (Dot.screen*(10/8)*(size/Dot.screen))/2,
            y: y - (Dot.screen*(10/8)*(size/Dot.screen))/2
        }
        this.velocity = {x:0, y:0}
        this.colliding = false;

        this.lastPos = {x: this.position.x , y: this.position.y };
        this.size = (size * 100)/Dot.screen;
        this.rawSize = size;

        this.element = this.create();
        this.weight = Math.pow(size/2, 2);
    };

    resize(rawSize) {
        this.size = (rawSize * 100)/Dot.screen;
        this.rawSize = rawSize;

        if(this.element != null) {
            this.element.style.height = this.size + "%";
            this.element.style.width = this.size + "%";
        }

        const pos_ = this.justify(this.position.x, this.position.y);
        this.move_to(pos_.x, pos_.y);

        this.weight = Math.pow(this.size/2, 2);
    }

    create() {
        const newDot = document.createElement("div");
        newDot.classList.add("dot");


        const newSphere = document.createElement("span");
        newSphere.classList.add("sphere");

        newDot.style.left = 100*(this.position.x/Dot.screen) + "%";
        newDot.style.top = 100*(this.position.y/Dot.screen) + "%";

        newDot.style.height = this.size + "%";
        newDot.style.width = this.size + "%";

        newDot.appendChild(newSphere);
        return newDot;
    }

    justify(x, y) {
        const center = {
            x: Dot.screen / 2,
            y: Dot.screen / 2
        };
    
        const vetor = { x: x - center.x, y: y - center.y };
        const distance = Math.sqrt(Math.pow(vetor.x, 2) + Math.pow(vetor.y, 2));
    
        if (distance <= Dot.screen / 2 - this.rawSize / 2)
            return { x: x, y: y };
        
    
        if (distance === 0)
            return { x: x, y: y };
        
    
        const normalized = { x: vetor.x / distance, y: vetor.y / distance };
        const offset = Dot.screen / 2 - this.rawSize / 2;
    
        return {
            x: center.x + normalized.x * offset,
            y: center.y + normalized.y * offset
        };
    }

    move_to(x, y) {
                
        const justify = this.justify(x, y);
        this.position.x = justify.x;
        this.position.y = justify.y;

        this.lastPos.x = this.position.x;
        this.lastPos.y = this.position.y;

        this.velocity.x = 0;
        this.velocity.y = 0;

        this.element.style.left = 100*((this.position.x)/Dot.screen) + "%";
        this.element.style.top = 100*((this.position.y)/Dot.screen) + "%";
    }

    move(x, y) {
        const justify = this.justify(this.position.x + x, this.position.y + y);
        this.position.x = justify.x;
        this.position.y = justify.y;

        this.element.style.left = 100*((this.position.x)/Dot.screen) + "%";
        this.element.style.top = 100*((this.position.y)/Dot.screen) + "%";
    }

    refresh(delta) {
        const inertia = 1;
        this.velocity.x = (this.position.x - this.lastPos.x)*inertia;
        this.velocity.y = (this.position.y - this.lastPos.y)*inertia;

        this.velocity.y += Dot.gravity * delta;
        this.lastPos = {x: this.position.x, y: this.position.y};
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
        this.move(0, 0);
    }

    is_colliding(is_colliding) {
        if(is_colliding == this.colliding)
            return;

        if(is_colliding)
            this.element.classList.add("colliding");
        else
            this.element.classList.remove("colliding");

        this.colliding = is_colliding;
        
        
    }
}

class Collision {

    constructor() {
        this.dots = [];
        this.dot_size = 10;
        this.count = 0;

        this.now = Date.now();
        this.lastUpdate = this.now;
        this.dt = this.now - this.lastUpdate;
        this.effect = null;
    }

    async blackHole() {

        document.addEventListener("mouseup", (event) => {
            if(event.button != 1)
                return;

            this.effect = null;
        });
        

        this.effect = () => {
            for(let i = 0; i < this.dots.length; i++) {
                const force = 80;
                const dot = this.dots[i];
                
                const vetor = {x: -dot.position.x + mousePos.x, y: -dot.position.y + mousePos.y};

                const distance = Math.sqrt( Math.pow(vetor.x, 2) + Math.pow(vetor.y, 2) );

                const normalized = {
                    x: vetor.x/distance,
                    y: vetor.y/distance
                };

                const force_ = force/( Math.pow(dot.weight, 0.6) * Math.pow(distance, 0.5));
                
                dot.move(normalized.x * force_, normalized.y * force_);
                dot.velocity.y = 0;
                dot.velocity.x = 0;
            }
        }
    }

    explosion() {
        const force = 150;
        

        for(let i = 0; i < this.dots.length; i++) {
            const dot = this.dots[i];
            
            const vetor = {x: dot.position.x - rawMouse.x, y: dot.position.y - rawMouse.y};

            const distance = Math.sqrt( Math.pow(vetor.x, 2) + Math.pow(vetor.y, 2) );

            const normalized = {
                x: vetor.x/distance,
                y: vetor.y/distance
            };

            const force_ = force/( Math.pow(dot.weight, 0.6) * Math.pow(distance, 0.2));
            //const force_ = force/( dot.weight * distance);
            
            dot.move(normalized.x * force_, normalized.y * force_);
            dot.velocity.y = 0;
            dot.velocity.x = 0;
        }
    }


    check() {
        this.now = Date.now();
        this.dt = this.now - this.lastUpdate;

        if(this.effect != null)
            this.effect();


        for(let i = 0; i < 3; i++) {
            
            this.dots.forEach(dot => {
                dot.is_colliding(false);
            });

            for(let i = 0; i < this.dots.length; i++) {
                const dot1 = this.dots[i];
                for(let j = i+1; j < this.dots.length; j++) {
                    const dot2 = this.dots[j];

                    this.colisao(dot1, dot2);
                }
            }
            
            /*
            this.dots.forEach(dot1 => {
                this.dots.forEach(dot2 => {
                    if(dot1 == dot2)
                        return;
                    
                    this.colisao(dot1, dot2);
                });
            });
            */
        }
        this.count ++;
        this.lastUpdate = this.now;
    }

    colisao(dot1, dot2) {
        const vetor = {
            x: dot1.position.x - dot2.position.x,
            y: dot1.position.y - dot2.position.y
        };
    
        const centerRadius = (dot1.rawSize + dot2.rawSize) / 2;
        const totalWeight = dot1.weight + dot2.weight;
        const distance = Math.sqrt(vetor.x * vetor.x + vetor.y * vetor.y);
    
        if (distance > centerRadius) {
            return;
        }
    
        if (distance < 0.0001)
            return;
        
    
        dot1.is_colliding(true);
        dot2.is_colliding(true);
    
        //const overlap = (centerRadius - distance) * 1.1;
        const overlap = (centerRadius - distance);
        const normalized = { x: vetor.x / distance, y: vetor.y / distance };
        const displacement = { x: normalized.x * overlap, y: normalized.y * overlap };
    
        const w2 = dot2.weight / totalWeight;
        const w1 = dot1.weight / totalWeight;
    
        dot2.move(-displacement.x * w1, -displacement.y * w1);
        dot1.move(displacement.x * w2, displacement.y * w2);
    }
    
}


const dots = [];

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

var currentDot = null;
const prevPos = {x:0, y:0};
const actualPos = {x:0, y: 0};
const collider = new Collision();

document.addEventListener('contextmenu', event => event.preventDefault());

    
document.addEventListener('mousedown', function(event) {
    event.preventDefault();

    //console.log(event.button);
    if(event.button == 2) {
        collider.explosion(mousePos);
        return;
    }

    if(event.button == 1) {
        collider.blackHole(mousePos);
        return;
    }

    if(mousePos.x < 0 || mousePos.y < 0)
        return;
        
    var rectBox = box.getBoundingClientRect();
    if(rawMouse.x > rectBox.width || rawMouse.y > rectBox.height)
        return;

    currentDot = new Dot(mousePos.x, mousePos.y, 13.4);
    currentDot.move_to(mousePos.x, mousePos.y);

    box.appendChild(currentDot.element);
    collider.dots.push(currentDot);

    onmousemove = (event) => {
        event.preventDefault();
        currentDot.move_to(mousePos.x, mousePos.y);
    };

    c_dot.innerHTML = `dots: ${collider.dots.length}`;
    increaseDot();

    async function increaseDot() {
        const delta = 33;

        while(onmousemove != null) {
            const size_ = currentDot.rawSize;
            currentDot.resize(size_*1.02 + 30/size_);
            
            await new Promise(r => setTimeout(r, delta));
        }
    }

});



document.addEventListener('mouseup', function(event) {
    if(currentDot == null)
        return;

    if(event.button != 0)
        return;
    
    currentDot.move_to(mousePos.x, mousePos.y);  
    dots.push(currentDot);
    onmousemove = null;
    currentDot = null;
});




document.addEventListener('keydown', function(event) {
    if(event.code != 'Space')
    return;

    event.preventDefault();
    update();
});





async function callUpdate() {
    //1000ms = 1s
    //0050ms = 0.050s
    //0033ms = 0.033s 30fps
    //0016ms = 0.016s 60fps
    const delta = 16;
    //const delta = 5;
    //const delta = 500;
    d_rate.innerHTML = `desired rate: ${delta}ms`;

    while(true) {
        await new Promise(r => setTimeout(r, delta));
        Dot.screen = box.getBoundingClientRect().height;

        collider.check();
        dots.forEach(dot => {
            dot.refresh(delta/1000);

            a_rate.innerHTML = `actual rate: ${collider.dt}ms`;
        });
    }
};

callUpdate();

const resize_ = (event) => {
    Dot.screen = box.getBoundingClientRect().height;
    Dot.dot_size = Dot.screen * 0.02 * 10/8;

    s_size.innerHTML = `box size: ${Dot.screen}px`;

    dots.forEach(dot => {
        dot.resize(dot.rawSize);
    });
}
resize_();
window.addEventListener('resize', resize_);
abstract class Collider extends Component{
    public shape: Shape;
    public physicsLayer = 1 << 0;
    public isTrigger: boolean;
    public registeredPhysicsBounds: Rectangle;
    public shouldColliderScaleAndRotationWithTransform = true;
    public collidesWithLayers = Physics.allLayers;

    public _localOffsetLength: number;
    public _isPositionDirty = true;
    public _isRotationDirty = true;
    protected _isParentEntityAddedToScene;
    protected _colliderRequiresAutoSizing;
    protected _localOffset: Vector2 = new Vector2(0, 0);
    protected _isColliderRegistered;

    public get bounds(): Rectangle {
        if (this._isPositionDirty || this._isRotationDirty){
            this.shape.recalculateBounds(this);
            this._isPositionDirty = this._isRotationDirty = false;
        }

        return this.shape.bounds;
    }

    public get localOffset(){
        return this._localOffset;
    }

    public set localOffset(value: Vector2){
        this.setLocalOffset(value);
    }

    public setLocalOffset(offset: Vector2){
        if (this._localOffset != offset){
            this.unregisterColliderWithPhysicsSystem();
            this._localOffset = offset;
            this._localOffsetLength = this._localOffset.length();
            this._isPositionDirty = true;
            this.registerColliderWithPhysicsSystem();
        }
    }

    public registerColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && !this._isColliderRegistered){
            Physics.addCollider(this);
            this._isColliderRegistered = true;
        }
    }

    public unregisterColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && this._isColliderRegistered){
            Physics.removeCollider(this);
        }
        this._isColliderRegistered = false;
    }

    public overlaps(other: Collider){
        return this.shape.overlaps(other.shape);
    }

    public collidesWith(collider: Collider, motion: Vector2){
        let oldPosition = this.shape.position;
        this.shape.position = Vector2.add(this.shape.position, motion);

        let result = this.shape.collidesWithShape(collider.shape);
        if (result)
            result.collider = collider;

        this.shape.position = oldPosition;

        return result;
    }

    public onAddedToEntity(){
        if (this._colliderRequiresAutoSizing){
            if (!(this instanceof BoxCollider)){
                console.error("Only box and circle colliders can be created automatically");
            }

            let renderable = this.entity.getComponent<RenderableComponent>(RenderableComponent);
            if (renderable){
                let renderbaleBounds = renderable.bounds;

                let width = renderbaleBounds.width / this.entity.scale.x;
                let height = renderbaleBounds.height / this.entity.scale.y;

                if (this instanceof BoxCollider){
                    let boxCollider = this as BoxCollider;
                    boxCollider.width = width;
                    boxCollider.height = height;

                    this.localOffset = Vector2.subtract(renderbaleBounds.center, this.entity.position);
                }
            }
        }

        this._isParentEntityAddedToScene = true;
        this.registerColliderWithPhysicsSystem();
    }
    
    public onRemovedFromEntity(){
        this.unregisterColliderWithPhysicsSystem();
        this._isParentEntityAddedToScene = false;
    }

    public onEnabled(){
        this.registerColliderWithPhysicsSystem();
        this._isPositionDirty = this._isRotationDirty = true;
    }

    public onDisabled(){
        this.unregisterColliderWithPhysicsSystem();
    }
}
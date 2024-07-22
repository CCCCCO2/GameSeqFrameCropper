// 全局变量
var needCropTop = true;
var needCropBottom = true;
var needDrawGuideLine = true;
var toleranceOfBottom = 5;
var isBottomCenter = true;

// UI 窗口界面
var win = new Window("dialog", "使锚点居中的裁剪");
win.orientation = "column";

// 居中锚点方式 Toggle Group
var radioGroup = win.add("panel", undefined, "居中锚点方式");
radioGroup.orientation = "row";
var radio1 = radioGroup.add("radiobutton", undefined, "底部中心");
var radio2 = radioGroup.add("radiobutton", undefined, "顶部中心");
radio1.value = true;

// 底部（顶部）容忍度 InputField 
var inputGroup = win.add("group");
inputGroup.add("statictext", undefined, "底部/顶部 范围:");
var inputField = inputGroup.add("edittext", [0, 0, 20, 20], toleranceOfBottom);

// 其它 Toggle
var needDrawGuideLineCheckbox = win.add("checkbox", undefined, "绘制参考线");
var neddCropTopCheckbox = win.add("checkbox", undefined, "对顶部裁剪");
var neddCropBottomCheckbox = win.add("checkbox", undefined, "对底部裁剪");
needDrawGuideLineCheckbox.value = true; // 默认选中
neddCropTopCheckbox.value = true; // 默认选中
neddCropBottomCheckbox.value = true; // 默认选中

// 裁剪当前文档 Button
var cropCurrentDocumentButton = win.add("button", undefined, "裁剪当前文档");
cropCurrentDocumentButton.onClick = function() 
{
    SyncParameters()
    var doc = app.activeDocument;
    CropCurrentDocument(doc);
};

// 裁剪所有打开文档 Button
var cropAllOpenedDocumentButton = win.add("button", undefined, "裁剪所有打开文档");
cropAllOpenedDocumentButton.onClick = function() 
{
    SyncParameters()
    var docs = app.documents;

    // 遍历每一个文档
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]; // 当前文档

        // 激活当前文档
        app.activeDocument = doc;
        
        CropCurrentDocument(doc);
    }
};

// 保存所有打开文档 Button
var saveAllOpenedDocumentButton = win.add("button", undefined, "保存所有打开文档（覆盖）");
saveAllOpenedDocumentButton.onClick = function() 
{
    var docs = app.documents;

    // 遍历每一个文档
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]; // 当前文档

        // 激活当前文档
        app.activeDocument = doc;
        
        SaveDocument(doc);
    }
};

// 关闭 Button
var closeButton = win.add("button", undefined, "关闭");
closeButton.onClick = function() {
    win.close();
};

win.show();


// 同步参数
function SyncParameters()
{
    needDrawGuideLine = needDrawGuideLineCheckbox.value;
    needCropTop = neddCropTopCheckbox.value;
    needCropBottom = neddCropBottomCheckbox.value;
    isBottomCenter = radio1.value;
    
    var userInput = inputField.text;
    var integerInput = parseInt(userInput, 10);

    if (!isNaN(integerInput)) {
        toleranceOfBottom = integerInput;
    } else {
        alert("请输入有效的整数");
        return;
    }
}


// 裁剪文档
function CropCurrentDocument(doc) 
{
    // 获取当前文档宽度和高度
    var docWidth = doc.width;
    var docHeight = doc.height;

    // 获取当前图层
    var currentLayer = doc.activeLayer;

    // 图层的边界最大位置
    var currentLayerBounds = currentLayer.bounds;
    var currentLayerLeft = currentLayerBounds[0].value;
    var currentLayerRight = currentLayerBounds[2].value;
    var currentLayerTop = currentLayerBounds[1].value;
    var currentLayerBottom = currentLayerBounds[3].value;
    var currentLayerLeftMinPosition = Math.max(0, currentLayerLeft);
    var currentLayerRightMaxPosition = Math.min(docWidth, currentLayerRight);
    var currentLayerTopMinPositon = Math.max(0, currentLayerTop);
    var currentLayerBottomMaxPosition = Math.min(docHeight, currentLayerBottom);

    // 添加最大边界位置的参考线
    if(needDrawGuideLine)
    {
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        if(needCropTop)
        {
            var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        }
        if(needCropBottom)
        {
            var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
        }
    }

    // 复制图层重新获取一个区域范围的边界
    var duplLayer = currentLayer.duplicate();
    doc.activeLayer = duplLayer;
    var tempLayer = doc.activeLayer;
    
    // 根据锚点居中方式以及底部/顶部 容忍度获取选区
    var selectionRegion;
    if(isBottomCenter)
    {
        selectionRegion= [
            [0, 0],
            [docWidth, 0], 
            [docWidth, docHeight - toleranceOfBottom],
            [0, docHeight - toleranceOfBottom]
        ];
    }
    else
    {
        selectionRegion= [
            [0, docHeight - toleranceOfBottom],
            [docWidth, docHeight - toleranceOfBottom], 
            [0, docHeight],
            [docWidth, docHeight]
        ];
    }
    var type = SelectionType.REPLACE;
    var feather = 0;    // 羽化值
    var antiAlias = false;  // 是否抗锯齿
    doc.selection.select(selectionRegion, type, feather, antiAlias); // 创建矩形选区
    doc.selection.clear();
    doc.selection.deselect();

    var leftBound = doc.activeLayer.bounds[0].value;
    var topBound = doc.activeLayer.bounds[1].value;
    var rightBound = doc.activeLayer.bounds[2].value;
    var bottomBound = doc.activeLayer.bounds[3].value;

    if(needDrawGuideLine)
    {
        var guideLeftBottomcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(leftBound, "px"));
        var guideRightBottomcrop =doc.guides.add(Direction.VERTICAL, new UnitValue(rightBound, "px"));
    }

    try {
        tempLayer.remove(); 
    } catch (e) {
        alert("无法删除图层: " + e.message);
        return;
    }

     // 定义裁剪区域
    var cropRegion; 
    var cropAngle = 0
    var finalCropLeftPosition;
    var finalCropRightPosition;
    var finalCropToptPosition;
    var finalCropBottomPosition;
    
    var leftDifference= Math.abs(leftBound - currentLayerLeftMinPosition);
    var rightDifference = Math.abs(currentLayerRightMaxPosition- rightBound)
    
    if(leftDifference > rightDifference)
    {
        finalCropLeftPosition = currentLayerLeftMinPosition;
        finalCropRightPosition = rightBound + leftDifference;
    }
    else
    {
        finalCropLeftPosition = leftBound - rightDifference;
        finalCropRightPosition = currentLayerRightMaxPosition;
    }

    if(needCropTop)
    {
        finalCropToptPosition = currentLayerTopMinPositon;
    }
    else
    {
        finalCropToptPosition = 0;
    }

    if(needCropBottom)
    {
        finalCropBottomPosition = currentLayerBottomMaxPosition;
    }
    else
    {
        finalCropBottomPosition = docHeight;
    }

    cropRegion = [finalCropLeftPosition, finalCropToptPosition, finalCropRightPosition, finalCropBottomPosition];
    
    // 设置裁剪区域
    doc.crop(cropRegion, cropAngle);
}

// 保存文档
function SaveDocument(doc)
{
    doc.save();
}
/*!
* WebUploader插件
* 基于百度 Web Uploader 的再封装（http://fex.baidu.com/webuploader/）
* 此插件的核心代码参考博主李锦华，代码改动量很小，感谢somethingwhat的无私奉献！，如有侵权请及时联系156845044@qq.com（个人主站，https://www.somethingwhat.com/，博客园：http://blog.csdn.net/somethingwhat）
* 插件基本用法：
*           $("#divId").BrilliantWebUploader();
*
* Date: 2017-07-22 15:50
* Copyright 2013-2017 Brilliant
* Create by dfq
*/
/**
* 获取项目根目录
*/
var WEBUPLOADER_BASE_URL = "";
var WEB_BASE_URL = "";
var _args, _path = (function (script, i, me) {
    var l = script.length;

    for (; i < l; i++) {
        me = !!document.querySelector ?
            script[i].src : script[i].getAttribute('src', 4);
        if (me.substr(me.lastIndexOf('/')).indexOf('brilliant.webuploader') !== -1)
            break;
    }
    me = me.split('?'); _args = me[1];
    WEBUPLOADER_BASE_URL = me[0].substr(0, me[0].lastIndexOf('/') + 1);
    WEB_BASE_URL = WEBUPLOADER_BASE_URL.substr(0, WEBUPLOADER_BASE_URL.indexOf("/", 7) + 1);
    return me[0].substr(0, me[0].lastIndexOf('/') + 1);
})(document.getElementsByTagName('script'), 0);

window.Global = window.Global || {};
Global.FileQueueds = [];
Global.GetFileQueued = function (id) {
    var res = [];
    $.each(Global.FileQueueds, function (idx, row) {
        if (row.id == id) {
            res = row;
        }
    })
    return res;
};

//加载JS
document.write(" <script language=\"javascript\" src=\"" + WEBUPLOADER_BASE_URL + "webuploader.min.js\" > <\/script>");
/*!
* WebUploader插件 核心代码
*/
(function ($, window, document, undefined) {
    var _divId = "";
    var BrilliantWebUploader = function (ele, opt) {
        this.$element = ele, this.defaults = {
            baseURL: WEBUPLOADER_BASE_URL,
            //swf所在路径
            swf: WEBUPLOADER_BASE_URL + 'swf/Uploader.swf',
            uploadServerURL: WEBUPLOADER_BASE_URL + 'server/UploaderHandler.ashx?action=upload',//处理文件上传的地址
            getMaxChunkServerURL: WEBUPLOADER_BASE_URL + 'server/UploaderHandler.ashx?action=getmaxchunk',//获取已上传文件的块数量的接口地址
            mergeFilesServerURL: WEBUPLOADER_BASE_URL + "server/UploaderHandler.ashx?action=mergefiles", //进行文件合并的接口地址
            chunked: true, //分片处理大文件
            chunkSize: 2 * Math.pow(1024, 2),//2M 分片大小
            disableGlobalDnd: true,//是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开。
            threads: 1, //上传并发数
            formData: {},//附带属性
            fileNumLimit: 300,//单次上传最大文件数量,{int} [可选] [默认值：undefined] 验证文件总数量, 超出则不允许加入队列。
            fileSizeLimit: undefined,//{int} [可选] [默认值：undefined] 验证文件总大小是否超出限制, 超出则不允许加入队列。
            fileSingleSizeLimit: undefined,//{int} [可选] [默认值：undefined] 验证单个文件大小是否超出限制, 超出则不允许加入队列。
            compress: false, //图片在上传前不进行压缩
            uploader: null,//用于存放上传组件对象
            auto: false,//文件自动上传
            pick: { label: '点击选择文件' },//指定选择文件的按钮容器，不指定则不创建按钮。
            devMode: false,
            onUploaded: null,//文件上传成功事件 返回参数（file, md5）
            onRemoved: null,//文件移除事件  参数（file）
            fileImg: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAPAAA/+EDh2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU1NzcyLCAyMDE0LzAxLzEzLTE5OjQ0OjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjVDRUE3MDQzMTIwNTExRTM4OTZDQkUzRDVGMThCQTFDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjI2MTQ1NEMxNkRFNjExRTdCMjY4REFDNzk2MUU3NTdCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjI2MTQ1NEMwNkRFNjExRTdCMjY4REFDNzk2MUU3NTdCIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3YmFhMzViYi1hNTIwLWNiNDQtOTQwOS1kODVjMWMwNWU5MGEiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDphYWIwOTczZS02ZGUwLTExZTctOWY0OS1kMTVhZGFkNDNkMjUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCABLAFgDAREAAhEBAxEB/8QAcQABAAMBAQADAAAAAAAAAAAAAAEGBwQCAwUIAQEBAAAAAAAAAAAAAAAAAAAAARAAAQMBBQUHAwUAAAAAAAAAAAECAwQRMdEFFVGSY5NUIWGR0jNTFhIkBiKy4hNzEQEBAAAAAAAAAAAAAAAAAAAAEf/aAAwDAQACEQMRAD8A/VIACrr+U19vpxeDvMFPlVf7cXg7zAPlVf7cXg7zAPlVf7cXg7zAfNSfkdZLI9Hxx2Nje/sRyLa1qrtUI+6oa6CtgSWJe57FvauxQOgAAAAAM+W9QqAAADry71Zf8Zf2KB5oa6ejnSWJe5zVucmxQLjQ10FbAksS9z2Le1dihHQAAAAM+VUtXtCotTaAtTaAtTaB0UM0MczllcrWPY9iuRLVT6mql3YB7/py3q38r+QHRQ1FJRzpLDWP2OasXY5Ni/qAt4QAAAKaudV1q+ny2YBYjWq/h8tmAIa1X8PlswBDWq/h8tmAIa1X8PlswBDWq/h8tmAIlM6rrU9PlswBFyCAAABny3qFQAAAAAEpegGghAAAAz5b1CoAAAAACUvQDQQgAAAZ8t6hUAAAAABKXoBoIQAAAM+W9QqAAAAAAlL0A0EIAAAFGXLq+1ftpdx2AU07MOml3HYANOzDppdx2ADTsw6aXcdgA07MOml3HYANOzDppdx2ABMur7U+2l3HYAXkIAAAAAAAAAAAAAA//9k="

        }, this.options = $.extend({}, this.defaults, opt);
    }

    /**
    * 加载CSS样式
    * @url 待加载的url
    */
    function _loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    /**
    * 初始化dom
    * @obj 当前对象 
    */
    function _initDom(obj) {
        var $this = $(obj.$element);
        var settings = obj.options;
        _divId = $this.attr("id");//获取父容器Id
        $this.html("");//先清除dom
        var _dom = "<div id=\"wrapper\" class=\"brilliant-wrapper\">\n";
        _dom += "<div class=\"brilliant-container\"> \n";
        _dom += "<!--头部，相册选择和格式选择-->\n<div id=\"" + _divId + "-uploader\" class=\"brilliant-uploader\">\n";
        _dom += " <div class=\"queueList\">\n";
        _dom += "<div id=\"" + _divId + "-dndArea\" class=\"placeholder dndArea\">\n";
        _dom += "<div id=\"" + _divId + "-filePicker\" ></div>";
        _dom += " <p>或将文件拖到这里，单次最多可选" + settings.fileNumLimit + "个</p>\n";
        _dom += "</div>";
        _dom += "</div>";
        _dom += "<div class=\"statusBar\" style=\"display: none;\">\n";
        _dom += "<div class=\"progress\">\n";
        _dom += " <span class=\"text\">0%</span>\n";
        _dom += " <span class=\"percentage\"></span>\n";
        _dom += "  </div>\n";
        _dom += "<div class=\"info\"></div>\n";
        _dom += " <div class=\"btns\">\n";
        _dom += " <div id=\"" + _divId + "-filePicker2\" class=\"brilliant-filePicker2\"></div>\n";
        _dom += " <div class=\"uploadBtn\">开始上传</div>\n";
        _dom += " </div>\n";
        _dom += " </div>\n";
        _dom += " </div>\n";
        _dom += " </div>\n";
        _dom += "</div>\n";
        $this.append(_dom);
    }

    /**
    * 上传文件成功后(文件已合并)的回调事件
    * @obj  当前对象
    * @file 文件信息对象
    */
    function _uploadSuccessCallback(obj, file) {
        var settings = obj.options;
        if (settings.devMode) {
            console.info('UploadSuccessCallback=====');
            console.log(file);
        }
        _appendULTarget(file, "", "md5");
        if (settings.devMode) {
            console.info('提交文件', JSON.stringify(file));
        }
        $('.pop-window0 .pop-close').click();
    };

    /**
    * 追加到页面
    * @data  待添加的实体
    * @inputname  input的name属性 （可缺省，默认hiddenctrl）
    & @distinctprop  去重属性
    * @return 
    * @author dfq 2017.07.22
    */
    function _appendULTarget(data, inputname, distinctprop) {
        var distinct = false;
        var li = "";
        if (arguments.length >= 3) {
            li = "<li id=\"" + data[distinctprop] + "\">";
            distinct = true;
        }
        else {
            li = "<li>";
        }

        var tempName = "hiddenctrl";
        if (inputname != undefined && inputname != "") {
            tempName = inputname;
        }

        for (var prop in data) {
            li += "<input  type=\"hidden\" data-field=\"" + prop + "\" name=\"" + tempName + "\" value=\"" + data[prop] + "\" />";
        }
        li += "</li>";
        if (distinct) {
            if ($("#" + data[distinctprop]).length <= 0) {
                $("#" + _divId + " ul.succ-filelist").append(li);
            }
        }
        else {
            $("#" + _divId + " ul.succ-filelist").append(li);
        }
    }

    /**
     * 获取追加内容数据列表
     * @param property input的自定义属性名称 默认为 data-field 可缺省
     * @return data
     * @author dfq 2017.07.22
     */
    function _getLiValueList(property) {
        var datafield = "data-field";//隐藏域自定义属性
        if (arguments.length > 1) {
            datafield = property;
        }
        var data = [];
        var item = {};
        $("#" + _divId + " ul.succ-filelist li").each(function () {
            var $this = $(this);
            if ($.trim($this.html()) != "") {
                var inputlist = $this.children("input[type=\"hidden\"]");//获取li下所有input的集合
                var prop = "";//自定义属性值
                //遍历所有input
                inputlist.each(function () {
                    var $current_input = $(this); //获取当前隐藏控件
                    prop = $current_input.attr(datafield);//获取属性
                    if (prop != undefined) {
                        prop = $.trim(prop);
                        item[prop] = $current_input.val();
                    }
                });
                data.push(item);
                item = {};
            }
        });
        return data;
    }

    // 定义BrilliantWebUploader的方法
    BrilliantWebUploader.prototype = {
        // 渲染Tab
        _render: function () {
            var that = this, settings = this.options;
            _initDom(that, settings);//初始化dom
            var $this = $(that.$element);

            var $wrap = $("#" + _divId + "  " + settings.dnd),

       // 文件容器
           $queue = $('<ul class="filelist"></ul>')
               .appendTo($this.find('.queueList')),
        //上传成功
         $succqueue = $('<ul class="succ-filelist" style=\"display: none;\"></ul>')
               .appendTo($this.find('.queueList')),

       // 状态栏，包括进度和控制按钮
           $statusBar = $this.find('.statusBar'),

       // 文件总体选择信息。
           $info = $statusBar.find('.info'),

       // 上传按钮
           $upload = $this.find('.uploadBtn'),

       // 没选择文件之前的内容。
           $placeHolder = $this.find('.placeholder'),

           $progress = $statusBar.find('.progress').hide(),

       // 添加的文件数量
           fileCount = 0,

       // 添加的文件总大小
           fileSize = 0,

       // 优化retina, 在retina下这个值是2
           ratio = window.devicePixelRatio || 1,

       // 缩略图大小
           thumbnailWidth = 110 * ratio,
           thumbnailHeight = 110 * ratio,

       // 可能有pedding, ready, uploading, confirm, done.
           state = 'pedding',

       // 所有文件的进度信息，key为file id
           percentages = {},
       // 判断浏览器是否支持图片的base64
           isSupportBase64 = (function () {
               var data = new Image();
               var support = true;
               data.onload = data.onerror = function () {
                   if (this.width != 1 || this.height != 1) {
                       support = false;
                   }
               }
               data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
               return support;
           })(),

       // 检测是否已经安装flash，检测flash的版本
           flashVersion = (function () {
               var version;

               try {
                   version = navigator.plugins['Shockwave Flash'];
                   version = version.description;
               } catch (ex) {
                   try {
                       version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                               .GetVariable('$version');
                   } catch (ex2) {
                       version = '0.0';
                   }
               }
               version = version.match(/\d+/g);
               return parseFloat(version[0] + '.' + version[1], 10);
           })(),

           supportTransition = (function () {
               var s = document.createElement('p').style,
                   r = 'transition' in s ||
                           'WebkitTransition' in s ||
                           'MozTransition' in s ||
                           'msTransition' in s ||
                           'OTransition' in s;
               s = null;
               return r;
           })(),

       // WebUploader实例
           uploader,
           GUID = WebUploader.Base.guid(); //当前页面是生成的GUID作为标示
            var formData = { uid: GUID };
            formData = $.extend({}, settings.formData, formData);////由于Http的无状态特征，在往服务器发送数据过程传递一个进入当前页面是生成的GUID作为标示

            var pick = { id: "#" + _divId + "-filePicker" };//指定选择文件的按钮容器，不指定则不创建按钮。
            pick = $.extend({}, settings.pick, pick);////由于Http的无状态特征，在往服务器发送数据过程传递一个进入当前页面是生成的GUID作为标示

            if (!WebUploader.Uploader.support('flash') && WebUploader.browser.ie) {

                // flash 安装了但是版本过低。
                if (flashVersion) {
                    (function (container) {
                        window['expressinstallcallback'] = function (state) {
                            switch (state) {
                                case 'Download.Cancelled':
                                    alert('您取消了更新！')
                                    break;

                                case 'Download.Failed':
                                    alert('安装失败')
                                    break;

                                default:
                                    alert('安装已成功，请刷新！');
                                    break;
                            }
                            delete window['expressinstallcallback'];
                        };

                        var swf = WEBUPLOADER_BASE_URL + 'swf/expressInstall.swf';
                        // insert flash object
                        var html = '<object type="application/' +
                                'x-shockwave-flash" data="' + swf + '" ';

                        if (WebUploader.browser.ie) {
                            html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                        }

                        html += 'width="100%" height="100%" style="outline:0">' +
                            '<param name="movie" value="' + swf + '" />' +
                            '<param name="wmode" value="transparent" />' +
                            '<param name="allowscriptaccess" value="always" />' +
                        '</object>';

                        container.html(html);

                    })($wrap);

                    // 压根就没有安转。
                } else {
                    $wrap.html('<a href="http://www.adobe.com/go/getflashplayer" target="_blank" border="0"><img alt="get flash player" src="http://www.adobe.com/macromedia/style_guide/images/160x41_Get_Flash_Player.jpg" /></a>');
                }

                return;
            } else if (!WebUploader.Uploader.support()) {
                alert('Web Uploader 不支持您的浏览器！');
                return;
            }

            var dnd = "#" + _divId + "-dndArea";
            var paste = "#" + _divId + "-uploader";

            // 实例化,插件真正实例化的地方
            uploader = WebUploader.create({
                pick: pick,//指定选择文件的按钮容器，不指定则不创建按钮
                formData: formData,//由于Http的无状态特征，在往服务器发送数据过程传递一个进入当前页面是生成的GUID作为标示
                dnd: dnd,//指定Drag And Drop拖拽的容器，如果不指定，则不启动
                paste: paste,//指定监听paste事件的容器，如果不指定，不启用此功能。此功能为通过粘贴来添加截屏的图片。建议设置为document.body
                swf: settings.swf,
                chunked: settings.chunked, //分片处理大文件
                chunkSize: settings.chunkSize,//2M 分片大小
                server: settings.uploadServerURL,
                disableGlobalDnd: settings.disableGlobalDnd,//是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开。
                threads: settings.threads, //上传并发数
                fileNumLimit: settings.fileNumLimit,
                compress: settings.compress, //图片在上传前不进行压缩
                fileSizeLimit: settings.fileSizeLimit, //{int} [可选] [默认值：undefined] 验证文件总大小是否超出限制, 超出则不允许加入队列。
                fileSingleSizeLimit: settings.fileSingleSizeLimit //{int} [可选] [默认值：undefined] 验证单个文件大小是否超出限制, 超出则不允许加入队列。
            });

            settings.uploader = uploader;//WebUploaderd实例

            //校验MD5
            uploader.on('fileQueued', function (file) {

                uploader.md5File(file)

                    // 及时显示进度
                    .progress(function (percentage) {
                        var fileObj = $('#' + file.id);
                        var spanObj = fileObj.find('.progress_check>span').text(parseInt(percentage * 100));
                        if (settings.devMode) {
                            console.log('Percentage:', percentage, file.getStatus(), file);
                        }
                    })

                    // 完成
                    .then(function (val) {
                        if (settings.devMode) {
                            console.info('md5 result:', val, file);
                        }
                        $.extend(uploader.options.formData, { md5: val });

                        var fileObj = $('#' + file.id);

                        $.ajax({
                            url: settings.getMaxChunkServerURL,
                            async: true,
                            data: { md5: val, ext: file.ext },
                            success: function (response) {
                                if (settings.devMode) {
                                    console.info('response', response);
                                }
                                var res = JSON.parse(response);
                                Global.FileQueueds.push({ id: file.id, name: file.name, md5: val, size: file.size, type: file.type, lastModifiedDate: file.lastModifiedDate, ext: file.ext, path: res.path, chunk: res.chunk, exists: res.exists });
                                if (settings.devMode) {
                                    console.info('fileCheckMaxChunk', file, res.chunk);
                                }
                                fileObj.find('.progress_check').attr('data-checkedcomplete', true).text('验证完成，等待上传').css('color', '#aaa');
                                //文件验证完成后自动触发上传
                                if (settings.auto) {
                                    uploader.upload();
                                }
                            }
                        });
                    });

            });

            // 拖拽时不接受 js, txt 文件。
            uploader.on('dndAccept', function (items) {
                var denied = false,
                    len = items.length,
                    i = 0,
                // 修改js类型
                    unAllowed = 'text/plain;application/javascript';

                for (; i < len; i++) {
                    // 如果在列表里面
                    if (unAllowed.indexOf(items[i].type)) {
                        denied = true;
                        break;
                    }
                }

                return !denied;
            });

            uploader.on('dialogOpen', function () {
            });

            // 添加“添加文件”的按钮，
            uploader.addButton({
                id: "#" + _divId + "-filePicker2",
                label: '继续添加'
            });

            uploader.on('ready', function () {
                window.uploader = uploader;
            });

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                        '<p class="title" title="' + file.name + '">' + file.name + '</p>' +
                        '<p class="imgWrap"></p>' +
                        '<p class="progress"><span></span></p>' +
                        '<p class="progress_check" data-checkedcomplete="false">正在验证文件：<span>0</span>%</p>' +
                        '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">删除</span>' +
                        '<span class="rotateRight">向右旋转</span>' +
                        '<span class="rotateLeft">向左旋转</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>'),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = '文件大小超出';
                                break;

                            case 'interrupt':
                                text = '上传暂停';
                                break;

                            default:
                                text = '上传失败，请重试';
                                break;
                        }

                        $info.text(text).appendTo($li);
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    // @todo lazyload
                    $wrap.text('预览中');
                    uploader.makeThumb(file, function (error, src) {
                        var img;

                        if (error) {
                            $wrap.text('不能预览');
                            $wrap.empty().append($('<img src="' + settings.fileImg + '">'));
                            if (settings.devMode) {
                                console.info('不能预览', src);
                            }
                            return;
                        }

                        if (isSupportBase64) {
                            img = $('<img src="' + src + '">');
                            $wrap.empty().append(img);
                        } else {
                            $.ajax('preview.ashx', {
                                method: 'POST',
                                data: src,
                                dataType: 'json'
                            }).done(function (response) {
                                if (response.result) {
                                    img = $('<img src="' + response.result + '">');
                                    $wrap.empty().append(img);
                                } else {
                                    $wrap.text("预览出错");
                                }
                            });
                        }
                    }, thumbnailWidth, thumbnailHeight);

                    percentages[file.id] = [file.size, 0];
                    file.rotation = 0;
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        //上传结束后移除删除按钮
                        //$li.off('mouseenter mouseleave');
                        //$btns.remove();
                    }

                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        if (settings.devMode) {
                            console.log(file.statusText);
                        }
                        showError(file.statusText);
                        percentages[file.id][1] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        $info.remove();
                        $prgress.css('display', 'block');
                        percentages[file.id][1] = 0;
                    } else if (cur === 'progress') {
                        $info.remove();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                        $prgress.hide().width(0);
                        $li.append('<span class="success"></span>');
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({ height: 30 });
                });

                $li.on('mouseleave', function () {
                    $btns.stop().animate({ height: 0 });
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;

                        case 1:
                            file.rotation += 90;
                            break;

                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~ ~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }
                });
                $li.appendTo($queue);
            }

            // 负责view的销毁
            function removeFile(file) {
                var files = Global.GetFileQueued(file.id);
                var $li = $('#' + file.id);
                delete percentages[file.id];
                updateTotalProgress();
                //移除
                $("#" + files.md5).remove();
                $li.off().find('.file-panel').off().end().remove();
                if (settings.onRemoved) {//移除文件事件订阅
                    settings.onRemoved(files);
                }
            }

            //更新进度条
            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[0];
                    loaded += v[0] * v[1];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            //更新上传状态
            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = '选中' + fileCount + '个文件，共' +
                            WebUploader.formatSize(fileSize) + '。';
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = '已成功上传' + stats.successNum + '个文件，' +
                            stats.uploadFailNum + '个文件上传失败，<a class="retry" href="#">重新上传</a>失败文件或<a class="ignore" href="#">忽略</a>'
                    }

                } else {
                    stats = uploader.getStats();
                    text = '共' + fileCount + '个（' +
                            WebUploader.formatSize(fileSize) +
                            '），已上传' + stats.successNum + '个';

                    if (stats.uploadFailNum) {
                        text += '，失败' + stats.uploadFailNum + '个';
                    }
                }

                $info.html(text);
            }

            //设置状态
            function setState(val) {
                var file, stats;

                if (val === state) {
                    return;
                }

                $upload.removeClass('state-' + state);
                $upload.addClass('state-' + val);
                state = val;

                switch (state) {
                    case 'pedding':
                        $placeHolder.removeClass('element-invisible');
                        $queue.hide();
                        $statusBar.addClass('element-invisible');
                        uploader.refresh();
                        break;

                    case 'ready':
                        $placeHolder.addClass('element-invisible');
                        $("#" + _divId + "-filePicker2").removeClass('element-invisible');
                        $queue.show();
                        $statusBar.removeClass('element-invisible');
                        uploader.refresh();
                        break;

                    case 'uploading':
                        $("#" + _divId + "-filePicker2").addClass('element-invisible');
                        $progress.show();
                        $upload.text('暂停上传');
                        break;

                    case 'paused':
                        $.each(uploader.getFiles(), function (idx, row) {
                            if (row.getStatus() == "progress") {
                                row.setStatus('interrupt');
                            }
                        })
                        //uploader.getFiles()[0].setStatus('interrupt');
                        $progress.show();
                        $upload.text('继续上传');
                        break;

                    case 'confirm':
                        $progress.hide();
                        $("#" + _divId + "-filePicker2").removeClass('element-invisible');
                        $upload.text('开始上传');

                        stats = uploader.getStats();
                        if (stats.successNum && !stats.uploadFailNum) {
                            setState('finish');
                            return;
                        }
                        break;
                    case 'finish':
                        stats = uploader.getStats();
                        if (stats.successNum) {
                            //console.info('finish', uploader, stats);
                            ////alert('上传完成');
                            //if (window.UploadSuccessCallback) {
                            //    window.UploadSuccessCallback();
                            //}
                        } else {
                            // 没有成功的图片，重设
                            state = 'done';
                            location.reload();
                        }
                        break;
                }

                updateStatus();
            }

            //上传过程中触发，携带上传进度。
            uploader.onUploadProgress = function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[file.id][1] = percentage;
                updateTotalProgress();
            };

            //当文件被加入队列以后触发。
            uploader.onFileQueued = function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
                setState('ready');
                updateTotalProgress();
            };

            //当文件被移除队列后触发。
            uploader.onFileDequeued = function (file) {
                fileCount--;
                fileSize -= file.size;

                if (!fileCount) {
                    setState('pedding');
                }

                removeFile(file);
                updateTotalProgress();

            };

            //all算是一个总监听器
            uploader.on('all', function (type, arg1, arg2) {
                //console.log("all监听：", type, arg1, arg2);
                var stats;
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm');
                        break;

                    case 'startUpload':
                        setState('uploading');
                        break;

                    case 'stopUpload':
                        setState('paused');
                        break;

                }
            });

            // 文件上传成功,合并文件。
            uploader.on('uploadSuccess', function (file, response) {
                if (settings.devMode) {
                    console.info('uploadSuccess', file, response);
                }

                var files = Global.GetFileQueued(file.id);
                if (settings.devMode) {
                    console.log("文件信息：");
                    console.log(files);
                }
                var json = {};
                json.name = files.name;
                json.path = files.path;
                json.size = files.size;
                json.extension = files.ext;
                json.md5 = files.md5;
                json.type = file.type;
                json.lastModifiedDate = file.lastModifiedDate;

                var md5 = files.md5;

                if (files.exists) {
                    _uploadSuccessCallback(that, json);//回调函数
                    if (settings.onUploaded) {//上传完毕事件订阅
                        file.name = files.name;
                        file.path = files.path;
                        file.size = files.size;
                        file.extension = files.ext;
                        file.md5 = files.md5;
                        settings.onUploaded(file, md5);
                    }
                }

                if (response && response.code >= 0) {
                    var dataObj = response;
                    if (dataObj.chunked) {
                        $.post(settings.mergeFilesServerURL, { md5: md5, ext: files.ext },
                        function (data) {
                            if (data.hasError) {
                                alert('文件合并失败！');
                            } else {

                                //alert(decodeURIComponent(data.savePath));
                                if (settings.devMode) {
                                    console.info('上传文件完成并合并成功，触发回调事件');
                                }
                                _uploadSuccessCallback(that, json);//回调函数
                                if (settings.onUploaded) {//上传完毕事件订阅
                                    file.name = files.name;
                                    file.path = files.path;
                                    file.size = files.size;
                                    file.extension = files.ext;
                                    file.md5 = files.md5;
                                    settings.onUploaded(file, md5);
                                }
                            }
                        });
                    }
                    else {

                        _uploadSuccessCallback(that, json);//回调函数
                        if (settings.onUploaded) {//上传完毕事件订阅
                            file.name = files.name;
                            file.path = files.path;
                            file.size = files.size;
                            file.extension = files.ext;
                            file.md5 = files.md5;
                            settings.onUploaded(file, md5);
                        }
                        if (settings.devMode) {
                            console.info('上传文件完成，不需要合并，触发回调事件');
                        }
                    }
                }
            });

            //当validate不通过时，会以派送错误事件的形式通知调用者。通过upload.on('error', handler)可以捕获到此类错误，目前有以下错误会在特定的情况下派送错来。
            // Q_EXCEED_NUM_LIMIT 在设置了fileNumLimit且尝试给uploader添加的文件数量超出这个值时派送。
            // Q_EXCEED_SIZE_LIMIT 在设置了Q_EXCEED_SIZE_LIMIT且尝试给uploader添加的文件总大小超出这个值时派送。
            // Q_TYPE_DENIED 当文件类型不满足时触发。。
            uploader.onError = function (code) {
                alert('Eroor: ' + code);
            };

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }
                if ($queue.find('.progress_check[data-checkedcomplete=false]').length > 0) {
                    alert('请等待文件验证完成');
                    return false;
                }
                else {
                    $queue.find('.progress_check').hide();
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $info.on('click', '.retry', function () {
                uploader.retry();
            });

            $info.on('click', '.ignore', function () {
                alert('todo');
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();



            return that;
        },
        //获取数据
        getData: function (data) {
            var that = this;
            return _getLiValueList();
        }
    }

    $.fn.BrilliantWebUploader = function (options) {
        // 创建BrilliantWebUploader的实体
        var model = new BrilliantWebUploader(this, options);
        _loadCss(WEBUPLOADER_BASE_URL + "css/brilliantwebuploader.css");//加载CSS

        var _chunk = 0;
        WebUploader.Uploader.register({
            "before-send-file": "beforeSendFile",
            "before-send": "beforeSend",
            "after-send-file": "afterSendFile"
        }, {
            beforeSendFile: function (file) {
                if (model.options.devMode) {
                    console.info('beforeSendFile', Global.FileQueueds, file);
                }
                $.each(Global.FileQueueds, function (idx, row) {
                    if (row.id == file.id) {
                        _chunk = row.chunk;
                    }
                });
                //_chunk = Global.FileQueueds.find(f=>f.id == file.id).chunk;
            },
            beforeSend: function (block) {
                var blob = block.blob.getSource(),
                    deferred = $.Deferred();
                if (model.options.devMode) {
                    console.info('blob', block);
                }

                //根据md5与服务端匹配，如果重复，则跳过。
                if (block.chunk < _chunk) {
                    deferred.reject();
                }
                else {
                    deferred.resolve();
                }

                return deferred.promise();

            },
            afterSendFile: function (file) {
            }
        });

        return model._render();
    };

})(jQuery, window, document);
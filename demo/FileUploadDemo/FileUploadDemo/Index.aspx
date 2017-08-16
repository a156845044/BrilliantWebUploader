<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Index.aspx.cs" Inherits="FileUploadDemo.Index" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title></title>
    <link href="webuploader-0.1.5/webuploader.css" rel="stylesheet" />
    <script src="scripts/jquery.js"></script>
    <script src="webuploader-0.1.5/webuploader.js"></script>
    <script type="text/javascript">
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
    </script>
    <script type="text/javascript">
        var uploader = null;
        var INTEROP_PATH = {
            //swf所在路径
            swf: 'webuploader-0.1.5/Uploader.swf',
            //处理文件上传的地址
            server: 'UploadHandler.ashx?action=upload',
            //获取已上传文件的块数量
            GetMaxChunk: 'UploadHandler.ashx?action=getmaxchunk',
            //进行文件合并的地址
            MergeFiles: "UploadHandler.ashx?action=mergefiles",
            AddUploadRecord: "UploadHandler.ashx?action=adduploadrecord"
        };

        $(function () {

            var $wrap = $('#uploader'),

          // 图片容器
              $queue = $('<ul class="filelist"></ul>')
                  .appendTo($wrap.find('.queueList')),

          // 状态栏，包括进度和控制按钮
              $statusBar = $wrap.find('.statusBar'),

          // 文件总体选择信息。
              $info = $statusBar.find('.info'),

          // 上传按钮
              $upload = $wrap.find('.uploadBtn'),

          // 没选择文件之前的内容。
              $placeHolder = $wrap.find('.placeholder'),

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

                        var swf = 'Scripts/expressInstall.swf';
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






            uploader = WebUploader.create({
                // swf文件路径
                swf: INTEROP_PATH.swf,

                // 文件接收服务端。
                server: INTEROP_PATH.server,
                chunked: true,//开启分片处理 

                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: '#picker',
                chunkSize: 10 * Math.pow(1024, 2), //(1kb)分片大小，单位为字节
                // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                resize: false
            });

            // 当有文件被添加进队列的时候
            uploader.on('fileQueued', function (file) {

                uploader.md5File(file)

               // 及时显示进度
               .progress(function (percentage) {
                   var fileObj = $('#' + file.id);
                   var spanObj = fileObj.find('.progress_check>span').text(parseInt(percentage * 100));
                   //if (percentage == 1) {
                   //fileObj.find('.progress_check').hide();
                   //fileObj.find('.progress_check').attr('data-checkedcomplete', true).text('验证完成，等待上传').css('color', '#aaa');
                   //}
                   console.log('Percentage:', percentage, file.getStatus(), file);
               })

               // 完成
               .then(function (val) {
                   console.info('md5 result:', val, file);
                   $.extend(uploader.options.formData, { md5: val });

                   var fileObj = $('#' + file.id);

                   $.ajax({
                       url: INTEROP_PATH.GetMaxChunk,
                       async: true,
                       data: { md5: val, ext: file.ext },
                       success: function (response) {
                           console.info('response', response);
                           var res = JSON.parse(response);
                           //$.extend(uploader.options.formData, { chunk: res.chunk });
                           Global.FileQueueds.push({ id: file.id, md5: val, size: file.size, ext: file.ext, chunk: res.data });
                           console.info('fileCheckMaxChunk', file, res.data);
                           fileObj.find('.progress_check').attr('data-checkedcomplete', true).text('验证完成，等待上传').css('color', '#aaa');
                           ////文件验证完成后自动触发上传
                           //uploader.upload();
                       }
                   });
               });




                //alert(file.name);
                $("#thelist").append('<div id="' + file.id + '" class="item">' +
                    '<h4 class="info">' + file.name + '</h4>' +
                    '<p class="state">等待上传...</p>' +
                '</div>');
            });

            //文件上传
            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress .progress-bar');

                // 避免重复创建
                if (!$percent.length) {
                    $percent = $('<div class="progress progress-striped active">' +
                      '<div class="progress-bar" role="progressbar" style="width: 0%">' +
                      '</div>' +
                    '</div>').appendTo($li).find('.progress-bar');
                }

                $li.find('p.state').text('上传中');

                $percent.css('width', percentage * 100 + '%');
            });

            //文件上传成功
            uploader.on('uploadSuccess', function (file, response) {
                // $('#' + file.id).find('p.state').text('已上传');
                console.info('uploadSuccess', file, response);
                if (response && response.code >= 0) {
                    var dataObj = JSON.parse(response.data);
                    var md5 = Global.GetFileQueued(file.id).md5;
                    if (dataObj.chunked) {
                        $.post(INTEROP_PATH.MergeFiles, { md5: md5, ext: dataObj.ext },
                        function (data) {
                            data = $.parseJSON(data);
                            if (data.hasError) {
                                alert('文件合并失败！');
                            } else {
                                //alert(decodeURIComponent(data.savePath));
                                console.info('上传文件完成并合并成功，触发回调事件');
                                if (window.UploadSuccessCallback) {
                                    window.UploadSuccessCallback(file, md5);
                                }
                            }
                        });
                    }
                    else {
                        console.info('上传文件完成，不需要合并，触发回调事件');
                        if (window.UploadSuccessCallback) {
                            window.UploadSuccessCallback(file, md5);
                        }
                    }
                }


            });

            uploader.on('uploadError', function (file) {
                $('#' + file.id).find('p.state').text('上传出错');
            });

            uploader.on('uploadComplete', function (file) {
                $('#' + file.id).find('.progress').fadeOut();
            });

            //========================自定义====================================
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
                        $('#filePicker2').removeClass('element-invisible');
                        $queue.show();
                        $statusBar.removeClass('element-invisible');
                        uploader.refresh();
                        break;

                    case 'uploading':
                        $('#filePicker2').addClass('element-invisible');
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
                        $('#filePicker2').removeClass('element-invisible');
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


            uploader.onUploadProgress = function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[file.id][1] = percentage;
                updateTotalProgress();
            };

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



            $("#ctlBtn").click(function () {

                uploader.upload();
                return false;
            });

        });


        //这是上传文件成功后(文件已合并)的回调事件
        function UploadSuccessCallback(file, md5) {
            console.info('UploadSuccessCallback', file);
            var data = {
                Name: file.name,
                Size: file.size,
                Extension: file.ext
            };
            var jsonData = JSON.stringify(data);
            console.info('提交文件', jsonData);
            $.ajax({
                url: INTEROP_PATH.AddUploadRecord,
                type: 'post',
                data: { data: jsonData, md5: md5 },
                dataType: 'json',
                success: function (data) {
                    console.info(data);
                    if (data.code < 0) {
                        alert(data.errmsg);
                    }
                    else {
                        alert('文件[' + file.name + ']已上传并提交，请耐心等待管理员的审核');
                        $('.pop-window0 .pop-close').click();
                    }
                }
            });
        };
    </script>
</head>
<body>
    <form id="form1" runat="server">
        <%--  <div id="uploader" class="wu-example">
            <!--用来存放文件信息-->

            <div id="thelist" class="uploader-list"></div>
            <div class="btns">
                <div id="picker">选择文件</div>

                <button id="ctlBtn" class="btn btn-default">开始上传</button>
            </div>
        </div>
        <div class="statusBar" style="display: none;">
            <div class="progress">
                <span class="text">0%</span>
                <span class="percentage"></span>
            </div>
            <div class="info"></div>
            <div class="btns">
                <div id="filePicker2"></div>
                <div class="uploadBtn">开始上传</div>
            </div>
        </div>--%>


        <div id="wrapper">
            <div id="container">
                <!--头部，相册选择和格式选择-->
                <div id="uploader">
                    <div class="queueList">
                        <div id="dndArea" class="placeholder">
                            <div id="filePicker"></div>
                            <p>或将文件拖到这里，单次最多可选300个</p>
                        </div>
                    </div>
                    <div class="statusBar" style="display: none;">
                        <div class="progress">
                            <span class="text">0%</span>
                            <span class="percentage"></span>
                        </div>
                        <div class="info"></div>
                        <div class="btns">
                            <div id="filePicker2"></div>
                            <div class="uploadBtn">开始上传</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </form>
</body>
</html>

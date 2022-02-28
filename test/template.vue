<template>
  <div class="hsfundFuncanal-wrapper fais-indexcenter entry tmp-manage">
    <div class="left-content">
      <div class="box-title">
        <span slot="title">模板分类列表</span>
        <span class="add-clas" @click="clickAddClas">
          <h-icon name="add" color="#666"></h-icon>
        </span>
      </div>
      <!--树和搜索框-->
      <div class="left-tree">
        <FaisTreeSearch
          ref="leftTree"
          placeholder="模板名"
          :data="treeDataFilter"
          :currentNodeDefault="currentNodeDefault"
          onlyKey="id"
          @search-change="filterTree"
          @clickNode="clickNode"
          @clickNodeDelete="delNode"
          @clickNodeEdit="editNode"
          @onToggleExpand="onToggleExpand"
        ></FaisTreeSearch>
      </div>
    </div>
    <div class="right-content">
      <div class="top-tool" style="font-size: 0;">
        <h-button
          v-if="currentNode&&currentNode.sysDefFlag==='0'"
          class="mgr4"
          type="primary"
          size="small"
          :disabled="currentNode&&currentNode.parentCode==='-1'"
          @click="clickAddTmp"
        >新增</h-button>
        <h-button v-if="currentNode&&currentNode.sysDefFlag==='0'" type="ghost" size="small" @click="clickDelTmp">删除</h-button>
        <search-box
          v-model="tableSearchTxt"
          class="fr"
          placeholder="模板名称/模板说明"
          @on-enter="refreshTable"
          @on-blur="refreshTable"
          @on-search="refreshTable"
        />
      </div>
      <div class="table-box">
        <fais-table
          ref="faisTable"
          :columns="columns"
          :dataReq="dataReq"
          :query="tableQuery"
          :heightAuto="true"
          :filterTableDate="filterTableDate"
          :pSize="20"
          @selectionChange="selectionChange"
        ></fais-table>
      </div>
    </div>
    <h-msgBox
      v-model="showAddClas"
      :title="(isAddClas?'新增':'编辑')+'模板分类'"
      class-name="fais-indexcenter-modal"
      :mask-closable="false"
      width="394px"
      @on-close="showAddClas=false"
      @on-open="openAddClas"
    >
      <h-form v-if="showAddClas" ref="clsForm" :model="clsData" :label-width="116" @submit.native.prevent="()=>{}">
        <h-form-item label="分类名称" prop="tmplClasName" required>
          <h-input v-model="clsData.tmplClasName" placeholder="请输入分类名称" :maxlength="20"></h-input>
        </h-form-item>
      </h-form>
      <div slot="footer">
        <h-button type="ghost" size="small" @click="showAddClas=false">取消</h-button>
        <h-button type="primary" size="small" :loading="classLoading" @click="clickAddClasOk">确认</h-button>
      </div>
    </h-msgBox>
    <h-msgBox
      v-model="showAddTmp"
      :title="isAddTemp?'模板新增':'模板编辑'"
      class-name="fais-indexcenter-modal"
      :mask-closable="false"
      @on-close="showAddTmp=false"
      @on-open="openAddTmp"
    >
      <h-form ref="tmpForm" :model="tmplInfo" :rules="ruleValidate" :label-width="116">
        <div class="checktmp-box">
          <h-form-item label="选择模板" prop="tmplFileName" style="flex: 1;">
            <input
              v-model="tmplInfo.tmplFileName"
              style="width: 100%;"
              class="tmp-input"
              readonly
              :title="tmplInfo.tmplFileName"
              @click="clickTmp"
            />
          </h-form-item>
          <h-upload
            ref="upload"
            :action="action"
            :show-upload-list="false"
            :with-credentials="true"
            :format="['xls','xlsx','xlsm']"
            :on-success="uploadSuccess"
            :on-format-error="onFormatError"
            :on-error="uploadError"
          >
          <h-button class="upload-btn" size="small" type="ghost" >上传文件</h-button>
        </h-upload>
        </div>
        <h-form-item label="模板名称" prop="tmplName">
          <h-input v-model="tmplInfo.tmplName" placeholder="名称不能超过字符"></h-input>
        </h-form-item>
        <h-form-item label="模板说明" prop="tmplClasName">
          <h-input v-model="tmplInfo.tmplDesc" type="textarea" :rows="3" placeholder="说明不能超过200字符"></h-input>
        </h-form-item>
      </h-form>
      <div slot="footer">
        <h-button type="ghost" size="small" @click="showAddTmp=false">取消</h-button>
        <h-button type="primary" size="small" :loading="tempLoading" @click="clickAddTmpOk">确认</h-button>
      </div>
    </h-msgBox>
  </div>
</template>

<script>
import { downloadFile, blobToText } from '@hsfundFuncanal/scripts/utils';
import {
  queryTmplTree,
  queryTmplList,
  addTmplClasInfo,
  deleteTmplClas,
  addOrUpdateTmplInfo,
  deleteTmplInfo,
  downLoadFlieFormServer,
  downloadAttach,
  updateTmplClasName
} from '@hsfundFuncanal/api/index';
import { getFilterTree } from '@hsfundFuncanal/scripts/treeFunc';
// import {FaisTable} from '@fais/tzfx-comps'
import { FaisTable, FaisTreeSearch } from '@fais/tzjc-comps';
// import FaisTreeSearch from "@hsfundFuncanal/views/fais-indexcenter/components/FaisTreeSearch";
import SearchBox from '../components/SearchBox';

export default {
  name: 'risk_indexcenter_templateManage',
  components: { FaisTable, FaisTreeSearch, SearchBox },
  data() {
    const validateTmplDesc = (rule, value, callback) => {
      if (!!value && value.length > 200) {
        callback(new Error('说明不能超过200字符'));
      } else {
        callback();
      }
    };
    const validateTmplName = (rule, value, callback) => {
      if (!!value && value.length > 100) {
        callback(new Error('模板名称不能超过100字符'));
      } else {
        callback();
      }
    };
    return {
      treeData: [],
      treeDataFilter: [],
      columns: [
        {
          type: 'selection',
          align: 'center',
          fixed: 'left',
          ellipsis: true,
          disabled: true,
          width: 29
        },
        {
          title: '模板分类',
          key: 'tmplClasName',
          ellipsis: true,
          render: (h, params) => {
            return h(
              'span',
              {
                domProps: {
                  title: params.row.tmplClasName || ''
                }
              },
              params.row.tmplClasName || '--'
            );
          }
        },
        {
          title: '模板名称',
          key: 'tmplName',
          ellipsis: true,
          render: (h, params) => {
            return h(
              'span',
              {
                domProps: {
                  title: params.row.tmplName || ''
                }
              },
              params.row.tmplName || '--'
            );
          }
        },
        {
          title: '模板说明',
          key: 'tmplDesc',
          ellipsis: true,
          render: (h, params) => {
            return h(
              'span',
              {
                domProps: {
                  title: params.row.tmplDesc || ''
                }
              },
              params.row.tmplDesc || '--'
            );
          }
        },
        {
          title: '操作员',
          key: 'inptPrsn',
          ellipsis: true,
          render: (h, params) => {
            return h(
              'span',
              {
                domProps: {
                  title: params.row.inptPrsn || ''
                }
              },
              params.row.inptPrsn || '--'
            );
          }
        },
        {
          title: '修改时间',
          key: 'inptTime',
          width: 160,
          ellipsis: true,
          render: (h, params) => {
            return h(
              'span',
              {
                domProps: {
                  title: params.row.inptTime || ''
                }
              },
              params.row.inptTime || '--'
            );
          }
        },
        {
          title: '操作',
          key: 'action',
          align: 'left',
          width: 120,
          fixed: 'right',
          render: (h, params) => {
            return h('span', [
              h(
                'span',
                {
                  class: {
                    'link-action': true
                  },
                  on: {
                    click: () => this.clickDownLoad(params.row)
                  }
                },
                '下载'
              ),
              h(
                'span',
                {
                  class: {
                    'link-action': true
                  },
                  style: {
                    display: params.row.isEdit === 1 ? 'inline' : 'none'
                  },
                  on: {
                    click: () => this.clickRowEdit(params.row)
                  }
                },
                '修改'
              )
            ]);
          }
        }
      ],
      tableSearchVal: '',
      currentNode: null,
      tableSearchTxt: '',
      showAddClas: false,
      clsData: {
        tmplClasName: ''
      },
      isAddClas: true, // 是否新增分类
      currentNodeId: null,
      currentNodeDefault: null,
      showAddTmp: false,
      tmplInfo: {
        tmplNum: null, // 模板编码
        tmplName: null, // 模板名称
        tmplClasNum: null, // 模板分类编码
        tmplDesc: '', // 模板说明
        tmplFileNum: null, // 模板文件编码
        tmplFileName: null // 模板文件名称
      },
      ruleValidate: {
        tmplName: [
          { required: true, message: '模板名称不能为空', trigger: 'change' },
          { validator: validateTmplName, trigger: 'change' }
        ],
        tmplFileName: [
          { required: true, message: '模板文件不能为空', trigger: 'change' }
        ],
        tmplDesc: [{ validator: validateTmplDesc, trigger: 'blur' }]
      },
      action:
        window.HSFUNDRISK_CONFIG.API_HOME_PUB_HTTP + '/upload/uploadAttach',
      selectionList: [],
      clasDataObj: {},
      isAddTemp: true,
      classLoading: false, // 模板按钮loading状态
      tempLoading: false // 模板loading状态
    };
  },
  props: [],
  computed: {
    tableQuery: function() {
      const rdata = {
        tmplClasNum: null,
        searchText: this.tableSearchTxt
      };
      if (this.currentNode) {
        rdata.tmplClasNum = this.currentNode.id;
      }
      return rdata;
    }
  },
  watch: {},
  methods: {
    // 获取表格数据
    dataReq: async function(params) {
      return queryTmplList(params);
    },
    // 树查询
    searchTree(val = '') {
      queryTmplTree({ queryTmplFlag: 0, searchText: val }).then(res => {
        const resCopy = res;
        this.setTreeData(resCopy);
        this.treeData = resCopy;
        this.treeDataFilter = resCopy;
      });
    },
    // 树查询
    filterTree(val = '') {
      if (val === '') {
        this.treeDataFilter = this.treeData;
      } else {
        this.treeDataFilter = getFilterTree(
          this.treeData,
          item => item.title.indexOf(val) !== -1
        );
      }
    },
    // 树数据处理
    setTreeData(data) {
      /** 上一次选中节点的父节点 */
      let parent = null;
      /** 是否搜索到到上一次选中节点 */
      let hit = false;
      const loop = data => {
        data.forEach(node => {
          if (node.parentCode === '-1') node.expand = true;
          if (
            node.sysDefFlag === '0' &&
            node.parentCode !== '-1' &&
            node.manageRole === 1
          ) {
            node['showDelete'] = true;
            node['showEdit'] = true;
          }
          if (!this.clasDataObj.hasOwnProperty(node.id)) {
            this.clasDataObj[node.id] = node;
          } else {
            node['expand'] = this.clasDataObj[node.id].expand;
          }
          if (this.currentNodeId === node.id) {
            hit = true;
            this.currentNodeDefault = node;
            this.currentNode = node;
            this.$nextTick().then(() => {
              this.refreshTable();
            });
          } else if (this.currentNode?.parentCode === node.id) {
            parent = node;
          }
          if (node.children && node.children.length !== 0)
            loop(node.children);
        });
      };
      loop(data);
      if (!hit && parent) {
        /** 因为只能删除当前选中的节点,因此不存在删除父级节点导致找不到父节点的情况 */
        if (parent) {
          this.currentNodeDefault = parent;
          this.currentNode = parent;
          this.$nextTick().then(() => {
            this.refreshTable();
          });
        } else {
          console.error('没有找到该节点已经其上层节点');
        }
      }
    },

    // 数节点展开
    onToggleExpand(node, status) {
      this.clasDataObj[node.id].expand = status;
    },
    // 表格搜索框按键
    // keyDownTable (event) {
    //   if (event.key === 'Enter') {
    //     this.refreshTable()
    //   }
    // },
    // 点击树节点
    clickNode(data) {
      this.currentNode = data;
      this.$nextTick().then(() => {
        this.refreshTable();
      });
    },
    // 刷新表格
    refreshTable() {
      this.$refs.faisTable.page = 1;
      this.$refs.faisTable.getData();
    },
    // 树节点删除
    delNode(data) {
      this.$hMsgBox.confirm({
        title: '提示',
        content: '确定删除该分类吗？',
        onOk: () => {
          deleteTmplClas({ tmplClasNum: data.id }).then(() => {
            this.$hMessage.success('删除成功！');
            this.searchTree();
          });
        }
      });
    },
    // 树节点编辑
    editNode(data) {
      this.clsData.tmplClasName = data.title;
      this.isAddClas = false;
      this.showAddClas = true;
    },
    // 点击添加分类按钮
    clickAddClas() {
      if (!this.currentNode) {
        this.$hMessage.warning({
          content: '请选择添加节点!'
        });
        return;
      }
      if (this.currentNode.sysDefFlag === '1') {
        this.$hMessage.warning({
          content: '系统默认分类不可添加!'
        });
        return;
      }
      if (
        this.currentNode.manageRole !== 1 &&
        this.currentNode.parentCode !== '-1'
      ) {
        this.$hMessage.warning({
          content: '您无该分类管理权限'
        });
        return;
      }
      this.isAddClas = true;
      this.clsData.tmplClasName = '';
      this.showAddClas = true;
    },
    // 添加分类弹框打开
    openAddClas() {
      this.$refs.clsForm.resetValidate();
    },
    // 添加分类弹框点击确定
    clickAddClasOk() {
      this.$refs.clsForm.validate(flag => {
        if (flag) {
          this.classLoading = true;
          this.clasDataObj[this.currentNode.id].expand = true;
          if (this.isAddClas) {
            addTmplClasInfo({
              tmplClasName: this.clsData.tmplClasName,
              tmplClasPrnNum: this.currentNode.id
            })
              .then(res => {
                this.classLoading = false;
                this.currentNodeId = res;
                this.showAddClas = false;
                this.$hMessage.success({
                  content: '添加成功！'
                });
                this.searchTree();
              })
              .catch(() => {
                this.classLoading = false;
              });
          } else {
            updateTmplClasName({
              tmplClasName: this.clsData.tmplClasName,
              tmplClasNum: this.currentNode.id
            })
              .then(res => {
                this.classLoading = false;
                this.currentNodeId = res ?? this.currentNode.id;
                this.showAddClas = false;
                this.$hMessage.success({
                  content: '更新成功！'
                });
                this.searchTree();
              })
              .catch(() => {
                this.classLoading = false;
              });
          }
        }
      });
    },
    // 添加模板弹框打开
    openAddTmp() {
      this.$nextTick(() => this.$refs.tmpForm.resetValidate());
    },
    // 点击添加模板弹框确定
    clickAddTmpOk() {
      this.$refs.tmpForm.validate(flag => {
        if (flag) {
          this.tempLoading = true;
          addOrUpdateTmplInfo({ tmplInfo: this.tmplInfo })
            .then(() => {
              this.tempLoading = false;
              this.$hMessage.success({
                content: '保存成功!'
              });
              this.refreshTable();
              this.showAddTmp = false;
            })
            .catch(() => {
              this.tempLoading = false;
            });
        }
      });
    },
    // 初始化添加模块弹框
    resetAddTmp() {
      this.tmplInfo = {
        tmplNum: null, // 模板编码
        tmplName: null, // 模板名称
        tmplClasNum: null, // 模板分类编码
        tmplDesc: '', // 模板说明
        tmplFileNum: null, // 模板文件编码
        tmplFileName: null // 模板文件名称
      };
    },
    // 点击添加模板按钮
    clickAddTmp() {
      if (!this.currentNode) {
        this.$hMessage.warning({
          content: '请先选择分类！'
        });
        return;
      }
      if (this.currentNode.sysDefFlag === '1') {
        this.$hMessage.warning({
          content: '系统默认分类不可添加!'
        });
        return;
      }
      if (this.currentNode.manageRole !== 1) {
        this.$hMessage.warning({
          content: '您无该分类管理权限'
        });
        return;
      }
      this.isAddTemp = true;
      this.resetAddTmp();
      this.tmplInfo.tmplClasNum = this.currentNode.id;
      this.showAddTmp = true;
    },
    // 模板上传格成功
    uploadSuccess(response, file) {
      this.tmplInfo.tmplFileNum = response.result;
      this.tmplInfo.tmplFileName = file.name;
      const fileNameArr = file.name.split('.');
      fileNameArr.pop();
      this.tmplInfo.tmplName = fileNameArr.join('.');
    },
    // 模板上传失败
    uploadError() {
      this.$hMessage.error({
        content: '上传失败!'
      });
    },
    // 模板上传格式不符合
    onFormatError() {
      this.$hMessage.error({
        content: '只能上传excel文件'
      });
    },
    // 点击添加模板弹框中模板
    clickTmp() {
      if (!this.tmplInfo.tmplFileNum) return;
      this.downLoadTmp(this.tmplInfo.tmplFileNum, this.tmplInfo.tmplFileName);
    },
    // 下载模板 - 自定义分类
    downLoadTmp(attachId, title) {
      downloadAttach({ attach_id: attachId }).then(res => {
        blobToText(res)
          .then(result => {
            const code = result.returnCode || result.return_code;
            const message = result.errorMessage || result.error_message;
            this.$hMessage.error(code + ': ' + message);
          })
          .catch(() => {
            downloadFile(res.data, title);
          });
      });
    },
    // 下载模板 - 系统分类
    downLoadTmpSystem(attachId, title) {
      downLoadFlieFormServer('/tmpl/downloadTmpl', {
        tmpl_num: attachId
      }).then(res => {
        blobToText(res)
          .then(result => {
            const code = result.returnCode || result.return_code;
            const message = result.errorMessage || result.error_message;
            this.$hMessage.error(code + ': ' + message);
          })
          .catch(() => {
            downloadFile(res.data, title);
          });
      });
    },
    // 点击行内下载
    clickDownLoad(row) {
      if (row.sysDefFlag === '1') {
        // 系统分类
        this.downLoadTmpSystem(row.tmplFileNum, row.tmplFileName);
      } else {
        // 自定义分类
        this.downLoadTmp(row.tmplFileNum, row.tmplFileName);
      }
    },
    // 点击行内编辑
    clickRowEdit(row) {
      this.isAddTemp = false;
      this.resetAddTmp();
      this.tmplInfo.tmplNum = row.tmplNum;
      this.tmplInfo.tmplName = row.tmplName;
      this.tmplInfo.tmplClasNum = row.tmplClasNum;
      this.tmplInfo.tmplDesc = row.tmplDesc;
      this.tmplInfo.tmplFileNum = row.tmplFileNum;
      this.tmplInfo.tmplFileName = row.tmplFileName;
      this.showAddTmp = true;
    },
    // 表格勾选改变
    selectionChange(selection) {
      this.selectionList = selection;
    },
    filterTableDate(data) {
      data.list &&
        data.list.forEach(row => {
          row['_disabled'] = row.isEdit !== 1;
        });
      return data;
    },
    // 点击删除模板按钮
    clickDelTmp() {
      if (this.selectionList.length === 0) {
        this.$hMessage.warning({
          content: '请先选择需要删除的模板'
        });
        return;
      }
      this.$hMsgBox.confirm({
        title: '提示',
        content: '确定删除所选模板吗？',
        onOk: () => {
          deleteTmplInfo({
            tmplNums: this.selectionList.map(row => row.tmplNum)
          }).then(() => {
            this.$hMessage.success({
              content: '删除成功!'
            });
            this.refreshTable();
          });
        }
      });
    }
  },
  beforeCreated() {},
  created() {
    this.searchTree();
  },
  mounted() {}
};
</script>
